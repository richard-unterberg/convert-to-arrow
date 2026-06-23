import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("leaves class and object methods unchanged", (t) => {
  const source = `class Timer {
  elapsed(): number {
    return 1
  }
}

const api = {
  getValue(): number {
    return 1
  },
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
