import * as path from "node:path"
import { type FunctionDeclaration, NewLineKind, Project, type SourceFile } from "ts-morph"
import { getComponentScriptBlocks, isComponentFile } from "./components.js"
import { convertDefaultExportFunction } from "./functions/default-export.js"
import { convertExportedFunction } from "./functions/exported-function.js"
import { convertLocalFunction } from "./functions/local-function.js"
import {
  type ConvertibleFunctionParts,
  type SkipReason,
  analyzeFunctionDeclaration,
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

const transformSourceFile = (sourceFile: SourceFile, filePath: string, lineOffset = 0) => {
  let touched = false
  const skipped: SkippedFunction[] = []
  const functions = sourceFile.getFunctions().map((node) => ({
    node,
    line: node.getStartLineNumber() + lineOffset,
  }))

  for (const { node, line } of functions) {
    const analysis = analyzeFunctionDeclaration(node)

    if (analysis.kind === "skipped") {
      skipped.push({ filePath, line, name: analysis.name, reason: analysis.reason })
      continue
    }

    if (convertFunction(node, sourceFile, analysis)) touched = true
  }

  return { touched, skipped }
}

const transformComponent = async (sourceFile: SourceFile, scriptProject: Project) => {
  const source = sourceFile.getFullText()
  const filePath = sourceFile.getFilePath()
  const blocks = await getComponentScriptBlocks(source, filePath)
  const skipped: SkippedFunction[] = []
  const chunks: string[] = []
  let touched = false
  let cursor = 0
  scriptProject.manipulationSettings.set({
    newLineKind: source.includes("\r\n") ? NewLineKind.CarriageReturnLineFeed : NewLineKind.LineFeed,
  })

  for (const [index, block] of blocks.entries()) {
    const script = scriptProject.createSourceFile(
      `${filePath}.${index}.${block.language}`,
      source.slice(block.start, block.end),
    )

    try {
      const lineOffset = source.slice(0, block.start).split(/\r\n|\r|\n/).length - 1
      const result = transformSourceFile(script, filePath, lineOffset)
      touched ||= result.touched
      skipped.push(...result.skipped)
      chunks.push(source.slice(cursor, block.start), script.getFullText())
      cursor = block.end
    } finally {
      scriptProject.removeSourceFile(script)
    }
  }

  if (touched) {
    chunks.push(source.slice(cursor))
    sourceFile.applyTextChanges([{ span: { start: 0, length: source.length }, newText: chunks.join("") }])
  }

  return { touched, skipped }
}

export const transformProject = async ({
  project,
  sourceFiles,
}: ProjectContext): Promise<TransformResult> => {
  const converted: string[] = []
  const skipped: SkippedFunction[] = []
  const scriptProject = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: project.getCompilerOptions(),
  })

  for (const sourceFile of sourceFiles) {
    if (isInNodeModules(sourceFile.getFilePath())) continue
    if (sourceFile.isDeclarationFile()) continue

    const result = isComponentFile(sourceFile.getFilePath())
      ? await transformComponent(sourceFile, scriptProject)
      : transformSourceFile(sourceFile, sourceFile.getFilePath())
    skipped.push(...result.skipped)

    if (result.touched) {
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
