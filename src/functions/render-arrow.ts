import type { FunctionDeclaration, Node, SourceFile } from "ts-morph"
import { getGenericText } from "./generics.js"

type RenderArrowOptions = {
  bodyNode: Node
  node: FunctionDeclaration
  sourceFile: SourceFile
}

export const renderArrowFunction = ({ bodyNode, node, sourceFile }: RenderArrowOptions): string => {
  const generics = getGenericText(node, sourceFile)
  const params = node
    .getParameters()
    .map((param) => param.getText())
    .join(", ")
  const returnText = node.getReturnTypeNode()?.getText()
  const returnDeclaration = returnText ? `: ${returnText}` : ""
  const body = bodyNode.getText()
  const asyncKeyword = node.isAsync() ? "async " : ""

  return `${asyncKeyword}${generics}(${params})${returnDeclaration} => ${
    body.startsWith("{") ? body : `{${body}}`
  }`
}
