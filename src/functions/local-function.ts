import type { FunctionDeclaration, SourceFile } from "ts-morph"
import { takeJsDocLead } from "./jsdoc.js"
import { renderArrowFunction } from "./render-arrow.js"
import type { ConvertibleFunctionParts } from "./skip-rules.js"

export const convertLocalFunction = (
  node: FunctionDeclaration,
  sourceFile: SourceFile,
  parts: ConvertibleFunctionParts,
): boolean => {
  if (node.hasExportKeyword() || node.hasDefaultKeyword()) return false

  const jsDocLead = takeJsDocLead(node)
  const arrowHead = renderArrowFunction({ bodyNode: parts.bodyNode, node, sourceFile })
  node.replaceWithText(`${jsDocLead}const ${parts.name} = ${arrowHead}`)

  return true
}
