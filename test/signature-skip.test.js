import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("skips this parameters, asserts returns, and anonymous default exports", (t) => {
  const source = `function withThis(this: HTMLElement, value: string) {
  this.textContent = value
}

function assertConfigFullyDefined(config: { value?: string }): asserts config is { value: string } {
  if (config.value === undefined) throw new Error("Missing value")
}

export default function () {
  return 1
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
