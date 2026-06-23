import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("skips generator function declarations", (t) => {
  const source = `function* counter() {
  yield 1
  yield 2
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
