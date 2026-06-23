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

test("skips functions that are called before their declaration", (t) => {
  const projectDir = createProject({
    "sample.js": `import { isDebug } from "./debug.js"

if (isDebug("vike:log")) {
  trackLogs()
}

function trackLogs() {
  process.stdout.write("debug\\n")
}
`,
    "debug.js": `export const isDebug = () => true
`,
  })
  t.after(() => removeProject(projectDir))

  runCli(projectDir, path.join(projectDir, "**/*.js"))

  assert.equal(
    readProjectFile(projectDir, "sample.js"),
    `import { isDebug } from "./debug.js"

if (isDebug("vike:log")) {
  trackLogs()
}

function trackLogs() {
  process.stdout.write("debug\\n")
}
`,
  )
})
