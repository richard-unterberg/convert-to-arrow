import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { transform as compileAstro } from "@astrojs/compiler"
import { compileScript, parse as parseVue } from "@vue/compiler-sfc"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

for (const extension of ["astro", "vue"]) {
  test(`converts the ${extension} fixture by default and preserves the component syntax`, async (t) => {
    const fixturePath = new URL(`./fixtures/component.${extension}`, import.meta.url)
    const fixtureBefore = fs.readFileSync(fixturePath, "utf8")
    const expected = fs.readFileSync(
      new URL(`./fixtures/component.expected.${extension}`, import.meta.url),
      "utf8",
    )
    const fileName = `sample.${extension}`
    const projectDir = createProject({ [fileName]: fixtureBefore })
    t.after(() => removeProject(projectDir))

    const result = runCli(projectDir)

    assert.match(result.stdout, /Found 1 source files/)
    assert.match(result.stdout, /Result: 1 converted files/)
    assert.equal(readProjectFile(projectDir, fileName), expected)
    assert.equal(fs.readFileSync(fixturePath, "utf8"), fixtureBefore)
    assert.deepEqual(fs.readdirSync(projectDir).sort(), [fileName, "tsconfig.json"])

    if (extension === "astro") {
      const compiled = await compileAstro(expected, { filename: fileName })
      assert.deepEqual(
        compiled.diagnostics.filter((diagnostic) => diagnostic.severity === 1),
        [],
      )
    } else {
      const { descriptor, errors } = parseVue(expected, { filename: fileName })
      assert.deepEqual(errors, [])
      assert.ok(compileScript(descriptor, { id: "fixture" }).content)
    }

    const secondRun = runCli(projectDir)
    assert.match(secondRun.stdout, /No convertible function declarations found/)
    assert.equal(readProjectFile(projectDir, fileName), expected)
  })
}

test("converts Vue JavaScript scripts, setup scripts, JSX and TSX", (t) => {
  const projectDir = createProject({
    "plain.vue": `<script>
export function greet(name = "Vue") { return name }
</script>
`,
    "setup.vue": `<script setup lang='js'>
function greet(...names) { return names.join(", ") }
</script>
`,
    "jsx.vue": `<script lang="jsx">
export function render() { return <div>Hello</div> }
</script>
`,
    "tsx.vue": `<script setup lang="tsx" generic="T">
function identity<T>(value: T): T { return value }
function render() { return <div>Hello</div> }
</script>
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  const expectedFiles = {
    "plain.vue": `<script>
export const greet = (name = "Vue") => { return name }
</script>
`,
    "setup.vue": `<script setup lang='js'>
const greet = (...names) => { return names.join(", ") }
</script>
`,
    "jsx.vue": `<script lang="jsx">
export const render = () => { return <div>Hello</div> }
</script>
`,
    "tsx.vue": `<script setup lang="tsx" generic="T">
const identity = <T,>(value: T): T => { return value }
const render = () => { return <div>Hello</div> }
</script>
`,
  }
  for (const [fileName, expected] of Object.entries(expectedFiles)) {
    assert.equal(readProjectFile(projectDir, fileName), expected)
    const { descriptor, errors } = parseVue(expected, { filename: fileName })
    assert.deepEqual(errors, [])
    assert.ok(compileScript(descriptor, { id: fileName }).content)
  }
})

test("honors explicit component globs and excludes node_modules", (t) => {
  const astro = "---\nfunction greet() { return 'Astro' }\n---\n<p>Hello</p>\n"
  const vue = "<script setup>\nfunction greet() { return 'Vue' }\n</script>\n"
  const projectDir = createProject({
    "sample.astro": astro,
    "sample.vue": vue,
    "node_modules/dependency/sample.astro": astro,
    "node_modules/dependency/sample.vue": vue,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir, path.join(projectDir, "**/*.vue"))
  assert.equal(readProjectFile(projectDir, "sample.astro"), astro)
  assert.equal(
    readProjectFile(projectDir, "sample.vue"),
    "<script setup>\nconst greet = () => { return 'Vue' }\n</script>\n",
  )

  runCli(projectDir, path.join(projectDir, "**/*.{astro,vue}"))
  assert.equal(
    readProjectFile(projectDir, "sample.astro"),
    "---\nconst greet = () => { return 'Astro' }\n---\n<p>Hello</p>\n",
  )
  assert.equal(readProjectFile(projectDir, "node_modules/dependency/sample.astro"), astro)
  assert.equal(readProjectFile(projectDir, "node_modules/dependency/sample.vue"), vue)
})

test("leaves external scripts, unsupported languages, data blocks and templates untouched", (t) => {
  const files = {
    "external.vue": '<script src="./external.js"></script>\n<template><p>Hello</p></template>\n',
    "coffee.vue": "<script lang='coffee'>function untouched() {}</script>\n",
    "data.vue": '<script type="application/json">{"example":"function untouched() {}"}</script>\n',
    "template.vue": "<template><pre>function untouched() {}</pre></template>\n",
    "template.astro": "<pre>function untouched() {}</pre>\n",
    "data.astro": '<script type="text/plain">function untouched() {}</script>\n',
    "external.astro": '<script src="./external.js">function untouched() {}</script>\n',
    "coffee.astro": '<script lang="coffee">function untouched() {}</script>\n',
    "dynamic.astro": "<script type={scriptType}>function untouched() {}</script>\n",
  }
  const projectDir = createProject(files)
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)
  assert.match(result.stdout, /No convertible function declarations found/)
  for (const [fileName, source] of Object.entries(files)) {
    assert.equal(readProjectFile(projectDir, fileName), source)
  }
})

test("preserves Unicode and CRLF while converting multiple script blocks", (t) => {
  const files = {
    "sample.astro": `---
// 🌍 Grüße
function heading() { return "Hallo" }
---
<p>🌍 Grüße</p>
<script>function first() { return "🌍" }</script>
<script is:inline>function second() { return "Grüße" }</script>
`.replaceAll("\n", "\r\n"),
    "sample.vue": `<template><p>🌍 Grüße</p></template>
<script setup lang="ts">function setup() { return "🌍" }</script>
<script lang="ts">export function normal() { return "Grüße" }</script>
`.replaceAll("\n", "\r\n"),
  }
  const projectDir = createProject(files)
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.astro"),
    `---
// 🌍 Grüße
const heading = () => { return "Hallo" }
---
<p>🌍 Grüße</p>
<script>const first = () => { return "🌍" }</script>
<script is:inline>const second = () => { return "Grüße" }</script>
`.replaceAll("\n", "\r\n"),
  )
  assert.equal(
    readProjectFile(projectDir, "sample.vue"),
    `<template><p>🌍 Grüße</p></template>
<script setup lang="ts">const setup = () => { return "🌍" }</script>
<script lang="ts">export const normal = () => { return "Grüße" }</script>
`.replaceAll("\n", "\r\n"),
  )
})

test("reports original component paths and lines even after a default export adds a line", (t) => {
  const source = `<script lang="ts">
export default function component() { return {} }
function collectArguments() { return arguments.length }
</script>
<script setup lang="ts">
hoisted()
function hoisted() { return true }
</script>
`
  const astro = `---
function collectArguments() { return arguments.length }
---
<p>🌍</p>
<script>
function unsafeHandler() { return this }
</script>
`
  const projectDir = createProject({ "sample.vue": source, "sample.astro": astro })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir, [projectDir, "--report"])

  assert.match(result.stdout, /Report: 4 skipped functions/)
  assert.ok(result.stdout.includes(`${path.join(projectDir, "sample.vue")}:3 - uses arguments`))
  assert.ok(
    result.stdout.includes(`${path.join(projectDir, "sample.vue")}:7 - referenced before declaration`),
  )
  assert.ok(result.stdout.includes(`${path.join(projectDir, "sample.astro")}:2 - uses arguments`))
  assert.ok(result.stdout.includes(`${path.join(projectDir, "sample.astro")}:6 - uses this`))
})
