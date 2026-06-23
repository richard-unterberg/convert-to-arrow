import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("skips functions whose bodies rely on this, arguments, or new.target", (t) => {
  const source = `function render() {
  return this.textContent
}

function collect() {
  return arguments.length
}

function Constructable() {
  return new.target
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
