# convert-to-arrow - codemod for JavaScript, TypeScript, Astro and Vue files.

Codemod to safely convert JavaScript and TypeScript `function` declarations into equivalent `const` arrow-function expressions.

```ts
// before
export function getUser<
  // user id type
  ID extends string | number,
>(id: ID): Promise<User> {
  return db.users.find(id)
}

// after (auto-generated)
export const getUser = <
  // user id type
  ID extends string | number,
>(id: ID): Promise<User> => {
  return db.users.find(id)
}
```

Works with `.ts`, `.tsx`, `.js`, `.jsx`, `.astro`, and `.vue` files. The default scan targets `**/*.{ts,tsx,astro,vue}`. JavaScript files are supported when you pass a JS-inclusive glob. See the [node tests](https://github.com/richard-unterberg/convert-to-arrow/tree/master/test) for documented conversion and skip examples.

## Quick-start (no install required)

run in the root of your repo - converts TypeScript, Astro and Vue files in the current directory and subdirectories:
```bash
npx convert-to-arrow
```

or specify a sub-folder / glob. Directory inputs default to `**/*.{ts,tsx,astro,vue}` and always exclude node_modules:
```bash
npx convert-to-arrow src
```
*More path options see [advanced usage](#advanced-usage)*

## Safety checklist

- Commit/stash your work first – revert is instant.
- Run the codemod
- Review the diff
- Run test suite / type-checking
- Check the files for identation changes – the codemod tries to preserve the original formatting, but it may not always succeed.

## Advanced usage

The CLI currently exposes one optional path argument. It can be either a directory or an explicit glob:

`node_modules` is always excluded from conversion, including when you pass a broad glob.

### Example:
```bash
# convert only files under ./src
npx -y convert-to-arrow src

# convert two workspaces
npx -y convert-to-arrow "packages/*/src"

# full glob (quotes required for zsh)
npx -y convert-to-arrow "**/*.tsx"

# include JavaScript and TypeScript explicitly
npx -y convert-to-arrow "**/*.{js,jsx,ts,tsx}"

# include all supported file types
npx -y convert-to-arrow "**/*.{js,jsx,ts,tsx,astro,vue}"
```

### Astro and Vue components

In `.astro` files, the codemod converts functions in the [frontmatter component script](https://docs.astro.build/en/reference/astro-syntax/) and embedded JavaScript/TypeScript `<script>` blocks. In `.vue` files, it converts functions in both [`<script>` and `<script setup>`](https://vuejs.org/api/sfc-spec.html), including `lang="ts"`, `lang="tsx"`, and `lang="jsx"`.

Templates, styles, HTML comments, and Vue custom blocks are preserved. External `<script src="...">` blocks, data scripts such as JSON-LD, and unsupported script languages are skipped. All existing function safety checks also apply inside components. Reports use the component's original path and line numbers.

### Report skipped functions

Pass `--report` to append a compact list of skipped functions to the normal conversion output:

```bash
npx -y convert-to-arrow --report src

# the flag can also come after the path/glob
npx -y convert-to-arrow src --report
```

Example report output:

```text
🗂 Report: 2 skipped functions:
  • trackLog... - /absolute/path/to/src/log.ts:12 - referenced before declaration
  • collectA... - /absolute/path/to/src/runtime.ts:34 - uses arguments
```

Skipped functions are left unchanged when converting them would change runtime behavior or produce invalid output.

## Contributing / local development

```bash
git clone https://github.com/richard-unterberg/convert-to-arrow
cd convert-to-arrow
npm i # install dependencies
npm run lefthook # git hooks
npm run test # builds the codemod and runs the node:test suite against dist/cli.js
npm run build # build the codemod - see dist
npm run verify # run repository checks
```

Pull requests & issues are welcome!
