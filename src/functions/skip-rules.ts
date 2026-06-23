import { type FunctionDeclaration, Node, SyntaxKind } from "ts-morph"

export type ConvertibleFunctionParts = {
  bodyNode: Node
  name: string
}

const hasUnsafeFunctionSemantics = (body: Node): boolean =>
  body.getDescendants().some((descendant) => {
    const kind = descendant.getKind()
    if (kind === SyntaxKind.ThisKeyword || kind === SyntaxKind.SuperKeyword) return true
    if (kind === SyntaxKind.MetaProperty && descendant.getText() === "new.target") return true
    return Node.isIdentifier(descendant) && descendant.getText() === "arguments"
  })

export const getConvertibleFunctionParts = (
  node: FunctionDeclaration,
): ConvertibleFunctionParts | undefined => {
  if (node.isOverload()) return undefined
  if (node.getOverloads().length) return undefined
  if (node.getParentIfKind(SyntaxKind.ClassDeclaration)) return undefined
  if (node.getParentIfKind(SyntaxKind.ObjectLiteralExpression)) return undefined
  if (node.isGenerator()) return undefined

  const bodyNode = node.getBody()
  if (!bodyNode) return undefined
  if (hasUnsafeFunctionSemantics(bodyNode)) return undefined

  if (node.getParameters().some((p) => p.getName() === "this")) return undefined

  const name = node.getName()
  if (!name) return undefined

  const returnTypeNode = node.getReturnTypeNode()
  if (returnTypeNode?.getText().trim().startsWith("asserts ")) return undefined

  return { bodyNode, name }
}
