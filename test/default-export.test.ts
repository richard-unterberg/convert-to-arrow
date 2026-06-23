import assert from "node:assert/strict"
import test from "node:test"
import {
  assertTypeScriptProject,
  createProject,
  readProjectFile,
  removeProject,
  runCli,
} from "./helpers/cli.js"

test("converts named default exports without duplicating existing export assignments", (t) => {
  const projectDir = createProject({
    "sample.ts": `export default async function fetchJson(url: string) {
  const res = await fetch(url)
  return (await res.json()) as unknown
}
`,
    "react.d.ts": `declare module "react" {
  export function useEffect(effect: () => void, deps: unknown[]): void
  export function useRef<T>(value: T): { current: T }
}
`,
    "use-previous.ts": `import { useEffect, useRef } from "react"

function usePrevious<T>(value: T): T {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export default usePrevious
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
  assert.equal(
    readProjectFile(projectDir, "use-previous.ts"),
    `import { useEffect, useRef } from "react"

const usePrevious = <T>(value: T): T => {
  const ref = useRef<T>(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export default usePrevious
`,
  )
  assertTypeScriptProject(projectDir)
})
