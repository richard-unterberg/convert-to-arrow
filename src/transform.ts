import * as path from "node:path"
import type { FunctionDeclaration, SourceFile } from "ts-morph"
import { convertDefaultExportFunction } from "./functions/default-export.js"
import { convertExportedFunction } from "./functions/exported-function.js"
import { convertLocalFunction } from "./functions/local-function.js"
import { type ProjectContext, isInNodeModules } from "./project.js"

const convertFunction = (node: FunctionDeclaration, sourceFile: SourceFile): boolean =>
  convertDefaultExportFunction(node, sourceFile) ||
  convertExportedFunction(node, sourceFile) ||
  convertLocalFunction(node, sourceFile)

export const transformProject = async ({ project, sourceFiles }: ProjectContext): Promise<string[]> => {
  const converted: string[] = []

  for (const sourceFile of sourceFiles) {
    if (isInNodeModules(sourceFile.getFilePath())) continue
    if (sourceFile.isDeclarationFile()) continue

    let touched = false

    for (const node of sourceFile.getFunctions()) {
      if (convertFunction(node, sourceFile)) {
        touched = true
      }
    }

    if (touched) {
      converted.push(path.relative(process.cwd(), sourceFile.getFilePath()))
    }
  }

  await Promise.all(
    project
      .getSourceFiles()
      .filter((sourceFile) => !isInNodeModules(sourceFile.getFilePath()))
      .map((sourceFile) => (sourceFile.isSaved() ? Promise.resolve() : sourceFile.save())),
  )

  return converted
}
