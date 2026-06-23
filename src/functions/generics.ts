import { type FunctionDeclaration, type SourceFile, SyntaxKind } from "ts-morph"

const makeTsxSafeGenerics = (generics: string, filePath: string): string => {
  if (!filePath.endsWith(".tsx") || !generics || generics.includes(",")) return generics
  return generics.replace(/>$/, ",>")
}

export const getGenericText = (node: FunctionDeclaration, sourceFile: SourceFile): string => {
  const lt = node.getFirstChildByKind(SyntaxKind.LessThanToken)
  const gt = node.getFirstChildByKind(SyntaxKind.GreaterThanToken)
  if (!lt || !gt) return ""

  const generics = sourceFile.getFullText().slice(lt.getStart(), gt.getEnd())
  return makeTsxSafeGenerics(generics, sourceFile.getFilePath())
}
