import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("skips declaration files and ambient functions", (t) => {
  const declaration = `export declare function fromTypes(value: string): string
`
  const ambient = `declare function fromSource(value: string): string
`
  const projectDir = createProject({
    "sample.d.ts": declaration,
    "sample.ts": ambient,
  })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.d.ts"), declaration)
  assert.equal(readProjectFile(projectDir, "sample.ts"), ambient)
})
