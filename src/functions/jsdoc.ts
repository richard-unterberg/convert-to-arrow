import type { FunctionDeclaration } from "ts-morph"

export const takeJsDocLead = (node: FunctionDeclaration): string => {
  const jsDocNodes = node.getJsDocs()
  const indentation =
    node
      .getSourceFile()
      .getFullText()
      .slice(node.getStartLinePos(), node.getStart())
      .match(/^[\t ]*/)?.[0] ?? ""
  const jsDocText = jsDocNodes.map((doc) => doc.getText()).join(`\n${indentation}`)

  for (const doc of jsDocNodes) {
    doc.remove()
  }

  return jsDocText ? `${jsDocText}\n${indentation}` : ""
}
