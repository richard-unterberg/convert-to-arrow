import { parse as parseAstro } from "@astrojs/compiler"
import { walk } from "@astrojs/compiler/utils"
import { parse as parseVue } from "@vue/compiler-sfc"

export type ScriptBlock = {
  start: number
  end: number
  language: string
}

export const isComponentFile = (filePath: string): boolean => /\.(astro|vue)$/.test(filePath)

const isJavaScriptType = (type: string): boolean =>
  [
    "",
    "module",
    "text/javascript",
    "application/javascript",
    "text/ecmascript",
    "application/ecmascript",
  ].includes(type.trim().toLowerCase())

const isScriptLanguage = (language: string): boolean => ["js", "jsx", "ts", "tsx"].includes(language)

export const getComponentScriptBlocks = async (source: string, filePath: string): Promise<ScriptBlock[]> => {
  const blocks: ScriptBlock[] = []

  if (filePath.endsWith(".vue")) {
    const { descriptor, errors } = parseVue(source, { filename: filePath, sourceMap: false })
    if (errors.length) {
      throw new Error(`Cannot parse ${filePath}: ${errors.map((error) => error.message).join("; ")}`)
    }

    for (const block of [descriptor.script, descriptor.scriptSetup]) {
      if (!block || "src" in block.attrs) continue
      const language = block.lang ?? "js"
      if (!isScriptLanguage(language)) continue
      if (!isJavaScriptType(String(block.attrs.type ?? ""))) continue

      blocks.push({ start: block.loc.start.offset, end: block.loc.end.offset, language })
    }
  } else {
    const { ast, diagnostics } = await parseAstro(source, { position: true })
    const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 1)
    if (errors.length) {
      throw new Error(`Cannot parse ${filePath}: ${errors.map((error) => error.text).join("; ")}`)
    }

    // Astro positions use UTF-8 byte offsets; string slicing uses UTF-16 code units.
    const bytes = Buffer.from(source)
    const toIndex = (offset: number): number => bytes.subarray(0, offset).toString().length

    walk(ast, (node) => {
      if (node.type === "frontmatter" && node.position) {
        const start = toIndex(node.position.start.offset) + 3
        blocks.push({ start, end: start + node.value.length, language: "ts" })
      }

      if (node.type !== "element" || node.name !== "script") return
      if (node.attributes.some((attribute) => attribute.name === "src")) return

      const type = node.attributes.find((attribute) => attribute.name === "type")
      if (type && (type.kind !== "quoted" || !isJavaScriptType(type.value))) return
      const lang = node.attributes.find((attribute) => attribute.name === "lang")
      const language = lang?.value ?? "ts"
      if ((lang && lang.kind !== "quoted") || !isScriptLanguage(language)) return

      for (const child of node.children) {
        if (child.type !== "text" || !child.position?.end) continue
        blocks.push({
          start: toIndex(child.position.start.offset),
          end: toIndex(child.position.end.offset),
          language,
        })
      }
    })
  }

  return blocks.sort((a, b) => a.start - b.start)
}
