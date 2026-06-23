import type { FunctionDeclaration, SourceFile } from "ts-morph"
import { takeJsDocLead } from "./jsdoc.js"
import { renderArrowFunction } from "./render-arrow.js"
import { getConvertibleFunctionParts } from "./skip-rules.js"

export const convertLocalFunction = (node: FunctionDeclaration, sourceFile: SourceFile): boolean => {
  if (node.hasExportKeyword() || node.hasDefaultKeyword()) return false

  const parts = getConvertibleFunctionParts(node)
  if (!parts) return false

  const jsDocLead = takeJsDocLead(node)
  const arrowHead = renderArrowFunction({ bodyNode: parts.bodyNode, node, sourceFile })
  node.replaceWithText(`${jsDocLead}const ${parts.name} = ${arrowHead}`)

  return true
}
