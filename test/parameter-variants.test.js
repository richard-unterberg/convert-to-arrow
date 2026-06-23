import assert from "node:assert/strict"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("converts default, rest, and destructured parameters", (t) => {
  const projectDir = createProject({
    "sample.ts": `export function joinLines(prefix: string | undefined = ">", ...lines: string[]): string {
  return lines.map((line) => \`\${prefix} \${line}\`).join("\\n")
}

function describe({ name, count = 0 }: { name: string; count?: number }): string {
  return \`\${name}: \${count}\`
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir)

  assert.equal(
    readProjectFile(projectDir, "sample.ts"),
    `export const joinLines = (prefix: string | undefined = ">", ...lines: string[]): string => {
  return lines.map((line) => \`\${prefix} \${line}\`).join("\\n")
}

const describe = ({ name, count = 0 }: { name: string; count?: number }): string => {
  return \`\${name}: \${count}\`
}
`,
  )
})
