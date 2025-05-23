# codemod: convert-to-arrow-function in ts and tsx files

Converts `function` declarations in your source tree into an equivalent `const` arrow-function, while keeping:

- async keyword
- type parameters  <T, K>()  verbatim (including inline comments / trailing commas / line breaks)
- parameter & return types
- a single, original JSDoc block
- export … & export default exactly as before

```ts
// before:
export function getUser<
  // user id type
  ID extends string | number,
>(id: ID): Promise<User> {
  return db.users.find(id)
}

// after:
export const getUser = <
  // user id type
  ID extends string | number,
>(id: ID): Promise<User> => {
  return db.users.find(id)
}
```

## Prerequisites
* **Node.js ≥ 16** (18 LTS recommended).  
  The script uses built-in modules like `node:path` and the global `process`

## Install

```bash
npm i -D tsx@^4 ts-morph@^25
# pnpm add -D tsx ts-morph 
# yarn add -D tsx ts-morph
```

## Usage

- Commit or stash your changes before running the script (Recommended)
- Install dependencies: See [Install](#install)
- Add the script — drop scripts/convert-to-arrow.ts
- `"npm run tsx scripts/convert-to-arrow.ts"`

### Optional: Wire a package.json command:
```json
{
  "scripts": {
    "codemod:to-arrow": "tsx scripts/convert-to-arrow.ts"
  }
}
```
- Run the script:
```bash
npm run codemod:to-arrow 
# pnpm run codemod:to-arrow 
# yarn codemod:to-arrow
```

### Other
- you don't need the package.json - it's just here for the future