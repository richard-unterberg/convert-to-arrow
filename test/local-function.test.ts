import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("converts a local function declaration", (t) => {
  const projectDir = createProject({
    "sample.ts": `function add(a: number, b: number): number {
  return a + b
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `const add = (a: number, b: number): number => {
  return a + b
}
`,
  )
})
