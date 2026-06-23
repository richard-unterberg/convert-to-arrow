import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("converts JavaScript only when an explicit JS glob is provided", (t) => {
  const projectDir = createProject({
    "sample.js": `export function add(a, b) {
  return a + b
}
`,
  })
  t.after(() => removeProject(projectDir))

  const defaultRun = runCli(projectDir)
  assert.match(defaultRun.stdout, /No convertible function declarations found/)
  assert.equal(
    readProjectFile(projectDir, "sample.js"),
    `export function add(a, b) {
  return a + b
}
`,
  )

  runCli(projectDir, path.join(projectDir, "**/*.js"))

  assert.equal(
    readProjectFile(projectDir, "sample.js"),
    `export const add = (a, b) => {
  return a + b
}
`,
  )
})
