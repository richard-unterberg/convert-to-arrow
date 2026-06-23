import { createProjectContext } from "./project.js"
import { transformProject } from "./transform.js"

const cliArg = process.argv[2] ?? "."
const context = createProjectContext(cliArg)

console.log("🙃 welcome to the convert-to-arrow codemod")
console.log(`⚙ Using tsconfig: ${context.tsConfigPath}`)
console.log(`🔍 Found ${context.sourceFiles.length} source files matching the glob`)

const converted = await transformProject(context)

console.log(
  converted.length
    ? `🗂 Result: ${converted.length} converted functions:\n${converted.map((file) => `  • ${file}`).join("\n")}`
    : "🎉 No convertible function declarations found",
)
