#!/usr/bin/env tsx
/**
 * Codemod: convert `function` declarations → `const` arrow functions.
 * • keeps generics verbatim, incl. inline comments & line-breaks
 * • preserves *exactly one* copy of the original JSDoc
 * • supports async, export, export default
 */
import path from "node:path"
import { Project, SyntaxKind } from "ts-morph"

const TS_CONFIG_PATH = "tsconfig.json"
const SOURCE_FILES = ["**/*.{ts,tsx}"]

const project = new Project({ tsConfigFilePath: path.resolve(process.cwd(), TS_CONFIG_PATH) })
const sourceFiles = project.getSourceFiles(SOURCE_FILES)
const converted: string[] = []

for (const sf of sourceFiles) {
  let touched = false

  for (const node of sf.getFunctions()) {
    // skip unsupported contexts
    if (node.isOverload()) continue
    if (node.getParentIfKind(SyntaxKind.ClassDeclaration)) continue
    if (node.getParentIfKind(SyntaxKind.ObjectLiteralExpression)) continue

    const name = node.getName()
    if (!name) continue // anonymous default export → untouched

    // Capture & strip JSDoc
    const jsDocNodes = node.getJsDocs()
    const jsDocText = jsDocNodes.map((d) => d.getText()).join("\n")
    for (const d of jsDocNodes) {
      d.remove() // avoid duplicates
    }
    const jsDocLead = jsDocText ? `${jsDocText}\n` : ""

    // Flags
    const isAsync = node.isAsync()
    const isDefault = node.isDefaultExport()
    const isNamedExp = node.isExported() && !isDefault

    // Grab generics verbatim
    let generics = ""
    const lt = node.getFirstChildByKind(SyntaxKind.LessThanToken)
    const gt = node.getFirstChildByKind(SyntaxKind.GreaterThanToken)
    if (lt && gt) {
      const src = sf.getFullText()
      generics = src.slice(lt.getStart(), gt.getEnd()) // includes “< … >”
    }

    // Params / return / body
    const params = node
      .getParameters()
      .map((p) => p.getText())
      .join(", ")
    const retTxt = node.getReturnTypeNode()?.getText()
    const retDecl = retTxt ? `: ${retTxt}` : ""
    const body = node.getBodyText() ?? "{}"

    // Arrow header
    const asyncKW = isAsync ? "async " : ""
    const arrowHead = `${asyncKW}${generics}(${params})${retDecl} => ${
      body.startsWith("{") ? body : `{${body}}`
    }`

    // Build replacement
    let replacement: string
    if (isDefault) {
      // default export needs two statements
      replacement = `${jsDocLead}const ${name} = ${arrowHead}\nexport default ${name}`
    } else {
      replacement = `${jsDocLead}${isNamedExp ? "export " : ""}const ${name} = ${arrowHead}`
    }

    node.replaceWithText(replacement)
    touched = true
  }

  if (touched) {
    converted.push(path.relative(process.cwd(), sf.getFilePath()))
    sf.organizeImports()
    sf.formatText({ indentSize: 2 })
  }
}

await project.save()

console.log(`\n🗂  Converted ${converted.length} function declarations to arrow functions:\n${converted}`)

console.log(
  converted.length
    ? `\n🗂  Converted to arrow functions:\n${converted.map((f) => `  • ${f}`).join("\n")}`
    : "No convertible function declarations found 🎉",
)
