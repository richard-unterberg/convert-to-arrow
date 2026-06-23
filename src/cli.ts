import fs from "node:fs"
import * as path from "node:path"
import { Node, Project, SyntaxKind } from "ts-morph"

const cliArg = process.argv[2] ?? "."
const userGlob = cliArg.includes("*") ? cliArg : path.join(cliArg, "/**/*.{ts,tsx}")
const nodeModulesGlob = path.join(process.cwd(), "**/node_modules/**")

const tsConfigGuess = path.resolve(cliArg, "tsconfig.json")

const hasLocalTsconfig = fs.existsSync(tsConfigGuess)
const TS_CONFIG_PATH = hasLocalTsconfig ? tsConfigGuess : path.resolve(process.cwd(), "tsconfig.json")

const project = new Project({
  tsConfigFilePath: TS_CONFIG_PATH,
  skipAddingFilesFromTsConfig: false,
})

const sourceFiles = project.addSourceFilesAtPaths([userGlob, `!${nodeModulesGlob}`])
const converted: string[] = []

const hasUnsafeFunctionSemantics = (body: Node): boolean =>
  body.getDescendants().some((descendant) => {
    const kind = descendant.getKind()
    if (kind === SyntaxKind.ThisKeyword || kind === SyntaxKind.SuperKeyword) return true
    if (kind === SyntaxKind.MetaProperty && descendant.getText() === "new.target") return true
    return Node.isIdentifier(descendant) && descendant.getText() === "arguments"
  })

const makeTsxSafeGenerics = (generics: string, filePath: string): string => {
  if (!filePath.endsWith(".tsx") || !generics || generics.includes(",")) return generics
  return generics.replace(/>$/, ",>")
}

console.log("🙃 welcome to the convert-to-arrow codemod")
console.log(`⚙ Using tsconfig: ${TS_CONFIG_PATH}`)
console.log(`🔍 Found ${sourceFiles.length} source files matching the glob`)

const isInNodeModules = (filePath: string): boolean => filePath.split(path.sep).includes("node_modules")

for (const sf of sourceFiles) {
  if (isInNodeModules(sf.getFilePath())) continue
  if (sf.isDeclarationFile()) continue

  let touched = false

  for (const node of sf.getFunctions()) {
    if (node.isOverload()) continue
    if (node.getOverloads().length) continue
    if (node.getParentIfKind(SyntaxKind.ClassDeclaration)) continue
    if (node.getParentIfKind(SyntaxKind.ObjectLiteralExpression)) continue

    // generators can't be arrow functions
    if (node.isGenerator()) continue

    const bodyNode = node.getBody()
    if (!bodyNode) continue
    if (hasUnsafeFunctionSemantics(bodyNode)) continue

    // no `this` parameter
    if (node.getParameters().some((p) => p.getName() === "this")) continue

    // no anonymous default export
    const name = node.getName()
    if (!name) continue

    // no asserts return type
    const retNode = node.getReturnTypeNode()
    if (retNode) {
      const retTxt = retNode.getText().trim()
      if (retTxt.startsWith("asserts ")) continue
    }

    // capture & strip JSDoc
    const jsDocNodes = node.getJsDocs()
    const jsDocText = jsDocNodes.map((d) => d.getText()).join("\n")
    for (const d of jsDocNodes) {
      // avoid duplicates
      d.remove()
    }
    const jsDocLead = jsDocText ? `${jsDocText}\n` : ""

    // flags
    const isAsync = node.isAsync()
    const isDefault = node.hasDefaultKeyword()
    const isNamedExp = node.hasExportKeyword() && !isDefault

    // generics verbatim
    let generics = ""
    const lt = node.getFirstChildByKind(SyntaxKind.LessThanToken)
    const gt = node.getFirstChildByKind(SyntaxKind.GreaterThanToken)
    if (lt && gt) {
      const src = sf.getFullText()
      generics = src.slice(lt.getStart(), gt.getEnd())
    }
    generics = makeTsxSafeGenerics(generics, sf.getFilePath())

    // params / return / body
    const params = node
      .getParameters()
      .map((p) => p.getText())
      .join(", ")
    const retTxt = node.getReturnTypeNode()?.getText()
    const retDecl = retTxt ? `: ${retTxt}` : ""
    const body = bodyNode.getText()

    // arrow header
    const asyncKW = isAsync ? "async " : ""
    const arrowHead = `${asyncKW}${generics}(${params})${retDecl} => ${
      body.startsWith("{") ? body : `{${body}}`
    }`

    // build replacement
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
  }
}

await Promise.all(
  project
    .getSourceFiles()
    .filter((sf) => !isInNodeModules(sf.getFilePath()))
    .map((sf) => (sf.isSaved() ? Promise.resolve() : sf.save())),
)

console.log(
  converted.length
    ? `🗂 Result: ${converted.length} converted functions:\n${converted.map((f) => `  • ${f}`).join("\n")}`
    : "🎉 No convertible function declarations found",
)
