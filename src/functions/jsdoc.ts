import type { FunctionDeclaration } from "ts-morph"

export const takeJsDocLead = (node: FunctionDeclaration): string => {
  const jsDocNodes = node.getJsDocs()
  const jsDocText = jsDocNodes.map((doc) => doc.getText()).join("\n")

  for (const doc of jsDocNodes) {
    doc.remove()
  }

  return jsDocText ? `${jsDocText}\n` : ""
}
