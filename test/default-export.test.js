import assert from "node:assert/strict"
import test from "node:test"
import {
  assertTypeScriptProject,
  createProject,
  readProjectFile,
  removeProject,
  runCli,
} from "./helpers/cli.js"

test("converts a named default export into a const plus default export", (t) => {
  const projectDir = createProject({
    "sample.ts": `export default async function fetchJson(url: string) {
  const res = await fetch(url)
  return (await res.json()) as unknown
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `const fetchJson = async (url: string) => {
  const res = await fetch(url)
  return (await res.json()) as unknown
}
export default fetchJson
`,
  )
  assertTypeScriptProject(projectDir)
})
