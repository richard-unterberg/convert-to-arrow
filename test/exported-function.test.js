import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("converts named exports and preserves later export lists", (t) => {
  const projectDir = createProject({
    "sample.ts": `export function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}

async function onGetJobs(): Promise<{ items: unknown[]; totalCount: number }> {
  return {
    items: [],
    totalCount: 0,
  }
}
export { onGetJobs }
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `export const randInt = (max: number): number => {
  return Math.floor(Math.random() * max)
}

const onGetJobs = async (): Promise<{ items: unknown[]; totalCount: number }> => {
  return {
    items: [],
    totalCount: 0,
  }
}
export { onGetJobs }
`,
  )
})
