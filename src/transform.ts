import * as path from "node:path"
import type { FunctionDeclaration, SourceFile } from "ts-morph"
import { convertDefaultExportFunction } from "./functions/default-export.js"
import { convertExportedFunction } from "./functions/exported-function.js"
import { convertLocalFunction } from "./functions/local-function.js"
import {
  analyzeFunctionDeclaration,
  type ConvertibleFunctionParts,
  type SkipReason,
} from "./functions/skip-rules.js"
import { type ProjectContext, isInNodeModules } from "./project.js"

export type SkippedFunction = {
  filePath: string
  line: number
  name: string
  reason: SkipReason
}

export type TransformResult = {
  converted: string[]
  skipped: SkippedFunction[]
}

const convertFunction = (
  node: FunctionDeclaration,
  sourceFile: SourceFile,
  parts: ConvertibleFunctionParts,
): boolean =>
  convertDefaultExportFunction(node, sourceFile, parts) ||
  convertExportedFunction(node, sourceFile, parts) ||
  convertLocalFunction(node, sourceFile, parts)

export const transformProject = async ({
  project,
  sourceFiles,
}: ProjectContext): Promise<TransformResult> => {
  const converted: string[] = []
  const skipped: SkippedFunction[] = []

  for (const sourceFile of sourceFiles) {
    if (isInNodeModules(sourceFile.getFilePath())) continue
    if (sourceFile.isDeclarationFile()) continue

    let touched = false

    for (const node of sourceFile.getFunctions()) {
      const analysis = analyzeFunctionDeclaration(node)

      if (analysis.kind === "skipped") {
        skipped.push({
          filePath: sourceFile.getFilePath(),
          line: node.getStartLineNumber(),
          name: analysis.name,
          reason: analysis.reason,
        })
        continue
      }

      if (convertFunction(node, sourceFile, analysis)) {
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

  return { converted, skipped }
}
