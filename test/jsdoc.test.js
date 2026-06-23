import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("preserves JSDoc on converted functions", (t) => {
  const projectDir = createProject({
    "sample.ts": `/**
 * Returns a random integer in [0, max)
 * @param max exclusive upper bound
 */
export function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `/**
 * Returns a random integer in [0, max)
 * @param max exclusive upper bound
 */
export const randInt = (max: number): number => {
  return Math.floor(Math.random() * max)
}
`,
  )
})
