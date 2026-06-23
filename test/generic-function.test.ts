import assert from "node:assert/strict"
import test from "node:test"
import {
  assertTypeScriptProject,
  createProject,
  readProjectFile,
  removeProject,
  runCli,
} from "./helpers/cli.js"

test("converts multiline commented generic functions", (t) => {
  const projectDir = createProject({
    "sample.ts": `export function pickFirst<
  // tuple of keys
  K extends readonly string[],
  // object type
  O extends Record<K[number], unknown>,
>(keyOrder: K, obj: O): O[K[number]] {
  for (const key of keyOrder) if (key in obj) return obj[key as K[number]]
  throw new Error("no key found")
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `export const pickFirst = <
  // tuple of keys
  K extends readonly string[],
  // object type
  O extends Record<K[number], unknown>,
>(keyOrder: K, obj: O): O[K[number]] => {
  for (const key of keyOrder) if (key in obj) return obj[key as K[number]]
  throw new Error("no key found")
}
`,
  )
  assertTypeScriptProject(projectDir)
})

test("converts TSX generic functions into parse-safe generic arrows", (t) => {
  const projectDir = createProject({
    "sample.tsx": `export function identity<T>(value: T): T {
  return value
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.tsx"),
    `export const identity = <T,>(value: T): T => {
  return value
}
`,
  )
  assertTypeScriptProject(projectDir)
})
