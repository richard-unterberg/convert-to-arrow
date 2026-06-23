# convert-to-arrow - codemod for js/ts files.

Codemod to safely convert `function` declarations into equivalent `const` arrow-function expressions.

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

Compatible with TypeScript and JavaScript. See the [node tests](https://github.com/richard-unterberg/convert-to-arrow/tree/master/test) for documented conversion and skip examples.

## Quick-start (no install required)

run in the root of your repo - converts all files in the current directory and subdirectories:
```bash
npx convert-to-arrow
```

or specify a sub-folder / glob (defaults to **/*.{ts,tsx}):
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

The CLI currently exposes one optional `directory` flag:

### Example:
```bash
# convert only files under ./src
npx -y convert-to-arrow src

# convert two workspaces
npx -y convert-to-arrow "packages/*/src"

# full glob (quotes required for zsh)
npx -y convert-to-arrow "**/*.tsx"
```

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
