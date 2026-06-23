import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("reports functions skipped because they are referenced before declaration", (t) => {
  const source = `import { isDebug } from "./debug.js"

if (isDebug("vike:log")) {
  trackLogs()
}

function trackLogs() {
  process.stdout.write("debug\\n")
}
`
  const projectDir = createProject({
    "sample.js": source,
    "debug.js": `export const isDebug = () => true
`,
  })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir, ["--report", path.join(projectDir, "**/*.js")])

  assert.match(result.stdout, /🎉 No convertible function declarations found/)
  assert.match(result.stdout, /🗂 Report: 1 skipped functions:/)
  assert.match(
    result.stdout,
    new RegExp(
      `  • trackLog\\.\\.\\. - ${escapeRegExp(path.join(projectDir, "sample.js"))}:7 - referenced before declaration`,
    ),
  )
  assert.equal(readProjectFile(projectDir, "sample.js"), source)
})

test("reports existing skip reasons with compact function names", (t) => {
  const projectDir = createProject({
    "sample.ts": `function* generatorLongName() {
  yield 1
}

function collectArguments() {
  return arguments.length
}

function withThisParameter(this: HTMLElement) {
  return "ok"
}

function assertConfigFullyDefined(config: { value?: string }): asserts config is { value: string } {
  if (config.value === undefined) throw new Error("Missing value")
}
`,
  })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir, ["--report", projectDir])
  const samplePath = escapeRegExp(path.join(projectDir, "sample.ts"))

  assert.match(result.stdout, /🗂 Report: 4 skipped functions:/)
  assert.match(result.stdout, new RegExp(`  • generato\\.\\.\\. - ${samplePath}:1 - generator function`))
  assert.match(result.stdout, new RegExp(`  • collectA\\.\\.\\. - ${samplePath}:5 - uses arguments`))
  assert.match(result.stdout, new RegExp(`  • withThis\\.\\.\\. - ${samplePath}:9 - has this parameter`))
  assert.match(result.stdout, new RegExp(`  • assertCo\\.\\.\\. - ${samplePath}:13 - asserts return type`))
})

test("does not print skipped functions without report flag", (t) => {
  const projectDir = createProject({
    "sample.ts": `calledBefore()

function calledBefore() {
  return true
}
`,
  })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.doesNotMatch(result.stdout, /🗂 Report:/)
  assert.doesNotMatch(result.stdout, /referenced before declaration/)
})

test("accepts report flag before or after the target", (t) => {
  const projectDir = createProject({
    "sample.ts": `calledBefore()

function calledBefore() {
  return true
}
`,
  })
  t.after(() => removeProject(projectDir))

  const beforeTarget = runCli(projectDir, ["--report", projectDir])
  const afterTarget = runCli(projectDir, [projectDir, "--report"])

  assert.match(beforeTarget.stdout, /🗂 Report: 1 skipped functions:/)
  assert.match(afterTarget.stdout, /🗂 Report: 1 skipped functions:/)
})

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
