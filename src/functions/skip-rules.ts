import { type FunctionDeclaration, Node, SyntaxKind } from "ts-morph"

export type ConvertibleFunctionParts = {
  bodyNode: Node
  name: string
}

export type SkipReason =
  | "referenced before declaration"
  | "overload declaration"
  | "overloaded implementation"
  | "generator function"
  | "ambient declaration"
  | "uses this"
  | "uses super"
  | "uses arguments"
  | "uses new.target"
  | "has this parameter"
  | "asserts return type"
  | "anonymous default export"

export type FunctionAnalysis =
  | ({ kind: "convertible" } & ConvertibleFunctionParts)
  | {
      kind: "skipped"
      name: string
      reason: SkipReason
    }

const hasUnsafeFunctionSemantics = (body: Node): SkipReason | undefined => {
  for (const descendant of body.getDescendants()) {
    const kind = descendant.getKind()
    if (kind === SyntaxKind.ThisKeyword) return "uses this"
    if (kind === SyntaxKind.SuperKeyword) return "uses super"
    if (kind === SyntaxKind.MetaProperty && descendant.getText() === "new.target") {
      return "uses new.target"
    }
    if (Node.isIdentifier(descendant) && descendant.getText() === "arguments") {
      return "uses arguments"
    }
  }

  return undefined
}

const isExportSpecifierReference = (node: Node): boolean =>
  Boolean(node.getFirstAncestor((ancestor) => Node.isExportSpecifier(ancestor)))

const isTypeOnlyReference = (node: Node): boolean =>
  Boolean(
    node.getFirstAncestor((ancestor) => {
      const kind = ancestor.getKind()
      return kind === SyntaxKind.TypeQuery || kind === SyntaxKind.TypeReference
    }),
  )

const hasEarlierRuntimeReference = (node: FunctionDeclaration): boolean => {
  const nameNode = node.getNameNode()
  if (!nameNode) return false

  const sourceFile = node.getSourceFile()
  const declarationStart = node.getStart()

  return nameNode.findReferencesAsNodes().some((reference) => {
    if (reference.getSourceFile() !== sourceFile) return false
    if (reference.getStart() >= declarationStart) return false
    if (isExportSpecifierReference(reference)) return false
    if (isTypeOnlyReference(reference)) return false
    return true
  })
}

export const analyzeFunctionDeclaration = (node: FunctionDeclaration): FunctionAnalysis => {
  if (node.isOverload()) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: "overload declaration" }
  }
  if (node.getOverloads().length) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: "overloaded implementation" }
  }
  if (node.isGenerator()) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: "generator function" }
  }

  const bodyNode = node.getBody()
  if (!bodyNode) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: "ambient declaration" }
  }

  const unsafeReason = hasUnsafeFunctionSemantics(bodyNode)
  if (unsafeReason) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: unsafeReason }
  }

  if (node.getParameters().some((p) => p.getName() === "this")) {
    return { kind: "skipped", name: node.getName() ?? "default", reason: "has this parameter" }
  }

  const name = node.getName()
  if (!name) {
    return { kind: "skipped", name: "default", reason: "anonymous default export" }
  }

  const returnTypeNode = node.getReturnTypeNode()
  if (returnTypeNode?.getText().trim().startsWith("asserts ")) {
    return { kind: "skipped", name, reason: "asserts return type" }
  }

  if (hasEarlierRuntimeReference(node)) {
    return { kind: "skipped", name, reason: "referenced before declaration" }
  }

  return { bodyNode, kind: "convertible", name }
}
