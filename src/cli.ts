import { createProjectContext } from "./project.js"
import type { SkippedFunction } from "./transform.js"
import { transformProject } from "./transform.js"

const args = process.argv.slice(2)
const shouldReport = args.includes("--report")
const positionalArgs = args.filter((arg) => arg !== "--report")
const cliArg = positionalArgs[0] ?? "."
const context = createProjectContext(cliArg)

const formatSkippedName = (name: string): string => `${name.slice(0, 8)}...`

const formatReport = (skipped: SkippedFunction[]): string =>
  skipped.length
    ? `🗂 Report: ${skipped.length} skipped functions:\n${skipped
        .map((skip) => `  • ${formatSkippedName(skip.name)} - ${skip.filePath}:${skip.line} - ${skip.reason}`)
        .join("\n")}`
    : "🗂 Report: 0 skipped functions"

console.log("++++++++++++++++++++++++++++++++++++++")
if (shouldReport) {
  console.log("convert-to-arrow codemod (Report) ++++")
} else {
  console.log("convert-to-arrow codemod +++++++++++++")
}
console.log(`${context.tsConfigPath}`)
console.log("++++++++++++++++++++++++++++++++++++++")
console.log(`🔍 Found ${context.sourceFiles.length} source files matching the glob:`)

const { converted, skipped } = await transformProject(context)

console.log(
  converted.length
    ? `✅ Result: ${converted.length} converted files:\n${converted.map((file) => `  • ${file}`).join("\n")}`
    : "🎉 No convertible function declarations found",
)

if (shouldReport) {
  console.log("")
  console.log(formatReport(skipped))
}
