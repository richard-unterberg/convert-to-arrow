import assert from "node:assert/strict"
import path from "node:path"
import test from "node:test"
import { createProject, readProjectFile, removeProject, runCli } from "./helpers/cli.js"

test("preserves distant export lists when converting JavaScript functions", (t) => {
  const projectDir = createProject({
    "sample.js": `export { function1 }
// some other import code between
export { function2 }

function function1() {
  return true;
}

export const arrowfnc = () => {
  return false;
}

function function2() {
  return true;
}
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir, path.join(projectDir, "**/*.js"))

  assert.equal(
    readProjectFile(projectDir, "sample.js"),
    `export { function1 }
// some other import code between
export { function2 }

const function1 = () => {
  return true;
}

export const arrowfnc = () => {
  return false;
}

const function2 = () => {
  return true;
}
`,
  )
})
