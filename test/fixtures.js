/**
 * A list of function declarations to test the conversion by convert-to-arrow codemod
 */

function add(a, b) {
  return a + b
}

/**
 * Returns a random integer in [0, max)
 * @param max – exclusive upper bound
 */
export function randInt(max) {
  return Math.floor(Math.random() * max)
}

export default async function fetchJson(url) {
  const res = await fetch(url)
  return await res.json()
}

export function pickFirst(keyOrder, obj) {
  for (const k of keyOrder) if (k in obj) return obj[k]
  throw new Error("no key found")
}

function tupleToObject(t) {
  return Object.assign({}, ...t.map((k) => ({ [k]: true })))
}

export function joinLines(prefix = ">", ...lines) {
  return lines.map((l) => `${prefix} ${l}`).join("\n")
}

export function toDate(x) {
  return new Date(x)
}

export async function loadParsed(url, parser) {
  const data = await (await fetch(url)).json()
  return parser.parse(data)
}

export function isStringArray(arr) {
  return arr.every((x) => typeof x === "string")
}

export function assertNever(x) {
  throw new Error(`Unexpected value: ${String(x)}`)
}

function withThis(value) {
  this.textContent = value
}

const _initConf = {
  someConfig: "default value",
}

let _config

function assertConfigFullyDefined(config) {
  let key
  for (key in config) {
    if (config[key] === undefined) {
      throw new Error(`Missing config for ${key}`)
    }
  }
}

export function getConfig() {
  if (!_config) {
    assertConfigFullyDefined(_initConf)
    _config = _initConf
  }

  return _config
}

class Timer {
  constructor() {
    this.start = performance.now()
  }

  /** Returns the elapsed milliseconds since construction or last `reset()` */
  elapsed() {
    return performance.now() - this.start
  }

  /** Waits `ms` milliseconds, then resets the timer */
  async tick(ms) {
    await new Promise((r) => setTimeout(r, ms))
    this.reset()
  }

  reset() {
    this.start = performance.now()
  }

  // Static helper — also must remain unchanged
  static format(ms) {
    return `${ms.toFixed(1)} ms`
  }
}
