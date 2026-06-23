import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("leaves existing arrow functions and function expressions unchanged", (t) => {
  const source = `const arrow = () => 1
const expression = function namedExpression() {
  return 2
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
