import vikeReact from "vike-react/config"
import type { Config } from "vike/types"
import Layout from "../layouts/LayoutDefault"

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  Layout,
  title: "My Vike App",
  description: "Demo showcasing Vike",
  prerender: true,
  extends: vikeReact,
} satisfies Config
