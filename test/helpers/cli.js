import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const helperDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(helperDir, "../..")
const cliPath = path.join(repoRoot, "dist/cli.js")
const tscPath = path.join(repoRoot, "node_modules/typescript/bin/tsc")

const defaultTsconfig = {
  compilerOptions: {
    allowJs: true,
    esModuleInterop: true,
    module: "NodeNext",
    moduleResolution: "NodeNext",
    noEmit: true,
    strict: true,
    target: "ESNext",
  },
  include: ["**/*"],
}

export function createProject(files, tsconfig = defaultTsconfig) {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "convert-to-arrow-test-"))
  writeProjectFile(projectDir, "tsconfig.json", `${JSON.stringify(tsconfig, null, 2)}\n`)

  for (const [filePath, contents] of Object.entries(files)) {
    writeProjectFile(projectDir, filePath, contents)
  }

  return projectDir
}

export function readProjectFile(projectDir, filePath) {
  return fs.readFileSync(path.join(projectDir, filePath), "utf8")
}

export function removeProject(projectDir) {
  fs.rmSync(projectDir, { force: true, recursive: true })
}

export function runCli(projectDir, target = projectDir) {
  const args = Array.isArray(target) ? target : [target]
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result
}

export function assertTypeScriptProject(projectDir) {
  const result = spawnSync(process.execPath, [tscPath, "--noEmit", "-p", projectDir], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
}

function writeProjectFile(projectDir, filePath, contents) {
  const fullPath = path.join(projectDir, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, contents)
}
