import assert from "node:assert/strict"
import test from "node:test"
import {
  assertTypeScriptProject,
  createProject,
  readProjectFile,
  removeProject,
  runCli,
} from "./helpers/cli.js"

test("converts explicit return, type predicate, and never return types", (t) => {
  const projectDir = createProject({
    "sample.ts": `export function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((item) => typeof item === "string")
}

export function assertNever(x: never): never {
  throw new Error(\`Unexpected value: \${String(x)}\`)
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `export const isStringArray = (arr: unknown[]): arr is string[] => {
  return arr.every((item) => typeof item === "string")
}

export const assertNever = (x: never): never => {
  throw new Error(\`Unexpected value: \${String(x)}\`)
}
`,
  )
  assertTypeScriptProject(projectDir)
})
