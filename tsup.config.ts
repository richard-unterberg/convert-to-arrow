import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: false,
  splitting: false,
  banner: { js: "#!/usr/bin/env node" },
  external: ["ts-morph"],
})
