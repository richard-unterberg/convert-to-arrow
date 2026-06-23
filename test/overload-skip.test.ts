import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("skips overload signatures and overloaded implementations", (t) => {
  const source = `export function toDate(timestamp: number): Date
export function toDate(iso: string): Date
export function toDate(x: number | string): Date {
  return new Date(x)
}
`
  const projectDir = createProject({ "sample.ts": source })
  t.after(() => removeProject(projectDir))

  const result = runCli(projectDir)

  assert.match(result.stdout, /No convertible function declarations found/)
  assert.equal(readProjectFile(projectDir, "sample.ts"), source)
})
