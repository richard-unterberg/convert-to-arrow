import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import type { SpawnSyncReturns } from "node:child_process"
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

export function createProject(files: Record<string, string>, tsconfig: object = defaultTsconfig): string {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "convert-to-arrow-test-"))
  writeProjectFile(projectDir, "tsconfig.json", `${JSON.stringify(tsconfig, null, 2)}\n`)

  for (const [filePath, contents] of Object.entries(files)) {
    writeProjectFile(projectDir, filePath, contents)
  }

  return projectDir
}

export function readProjectFile(projectDir: string, filePath: string): string {
  return fs.readFileSync(path.join(projectDir, filePath), "utf8")
}

export function removeProject(projectDir: string): void {
  fs.rmSync(projectDir, { force: true, recursive: true })
}

export function runCli(projectDir: string, target: string | string[] = projectDir): SpawnSyncReturns<string> {
  const args = Array.isArray(target) ? target : [target]
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  return result
}

export function assertTypeScriptProject(projectDir: string): void {
  const result = spawnSync(process.execPath, [tscPath, "--noEmit", "-p", projectDir], {
    cwd: repoRoot,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
}

function writeProjectFile(projectDir: string, filePath: string, contents: string): void {
  const fullPath = path.join(projectDir, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, contents)
}
