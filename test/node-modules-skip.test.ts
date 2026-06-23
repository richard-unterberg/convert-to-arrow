import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("excludes node_modules by default", (t) => {
  const projectDir = createProject({
    "src/sample.ts": `export function appFunction(): boolean {
  return true
}
`,
    "node_modules/dependency/index.ts": `export function dependencyFunction(): boolean {
  return false
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "src/sample.ts"),
    `export const appFunction = (): boolean => {
  return true
}
`,
  )
  assert.equal(
    readProjectFile(projectDir, "node_modules/dependency/index.ts"),
    `export function dependencyFunction(): boolean {
  return false
}
`,
  )
})
