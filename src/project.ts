import fs from "node:fs"
import * as path from "node:path"
import { Project, type SourceFile } from "ts-morph"

export type ProjectContext = {
  cliArg: string
  nodeModulesGlob: string
  project: Project
  sourceFiles: SourceFile[]
  tsConfigPath: string
  userGlob: string
}

export const isInNodeModules = (filePath: string): boolean =>
  filePath.split(path.sep).includes("node_modules")

export const createProjectContext = (cliArg: string): ProjectContext => {
  const userGlob = cliArg.includes("*") ? cliArg : path.join(cliArg, "/**/*.{ts,tsx}")
  const nodeModulesGlob = path.join(process.cwd(), "**/node_modules/**")

  const tsConfigGuess = path.resolve(cliArg, "tsconfig.json")
  const hasLocalTsconfig = fs.existsSync(tsConfigGuess)
  const tsConfigPath = hasLocalTsconfig ? tsConfigGuess : path.resolve(process.cwd(), "tsconfig.json")

  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
  })

  const sourceFiles = project.addSourceFilesAtPaths([userGlob, `!${nodeModulesGlob}`])

  return {
    cliArg,
    nodeModulesGlob,
    project,
    sourceFiles,
    tsConfigPath,
    userGlob,
  }
}
