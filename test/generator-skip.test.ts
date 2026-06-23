import assert from "node:assert/strict"
import { Project, SyntaxKind } from "ts-morph"

/**
 * Regression test: the codemod must skip generator function declarations
 * because generators cannot be expressed as arrow functions.
 *
 * Guard added in commit: "added a single guard to skip generator functions"
 */
function testGeneratorIsSkipped(): void {
  const sourceText = `function* counter() {
  yield 1
  yield 2
}

function plain() {
  return 42
}
`

  const project = new Project({ useInMemoryFileSystem: true })
  const sf = project.createSourceFile("__test__.ts", sourceText)

  for (const node of sf.getFunctions()) {
    if (node.isOverload()) continue
    if (node.getOverloads().length) continue
    if (node.getParentIfKind(SyntaxKind.ClassDeclaration)) continue
    if (node.getParentIfKind(SyntaxKind.ObjectLiteralExpression)) continue

    // The guard under test — mirrors src/cli.ts
    if (node.isGenerator()) continue

    // no `this` parameter
    if (node.getParameters().some((p) => p.getName() === "this")) continue

    const name = node.getName()
    if (!name) continue

    const retNode = node.getReturnTypeNode()
    if (retNode) {
      const retTxt = retNode.getText().trim()
      if (retTxt.startsWith("asserts ")) continue
    }

    const isAsync = node.isAsync()
    const params = node
      .getParameters()
      .map((p) => p.getText())
      .join(", ")
    const retTxt = node.getReturnTypeNode()?.getText()
    const retDecl = retTxt ? `: ${retTxt}` : ""
    const body = node.getBody()?.getText() ?? "{}"
    const arrowHead = `${isAsync ? "async " : ""}(${params})${retDecl} => ${
      body.startsWith("{") ? body : `{${body}}`
    }`
    node.replaceWithText(`const ${name} = ${arrowHead}`)
  }

  const result = sf.getFullText()

  // The generator must remain a function declaration (not converted)
  assert.ok(
    result.includes("function* counter()"),
    `Generator function should NOT be converted, but got:\n${result}`,
  )

  // The plain function should be converted to an arrow
  assert.ok(
    result.includes("const plain = "),
    `Plain function should be converted to arrow, but got:\n${result}`,
  )
}

testGeneratorIsSkipped()
console.log("✅ test/generator-skip.test.ts passed")
