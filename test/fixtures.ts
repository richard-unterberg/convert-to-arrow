/**
 * A list of function declarations to test the conversion by convert-to-arrow codemod
 */

function add(a: number, b: number): number {
  return a + b
}

/**
 * Returns a random integer in [0, max)
 * @param max – exclusive upper bound
 */
export function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}

export default async function fetchJson(url: string) {
  const res = await fetch(url)
  return (await res.json()) as unknown
}

export function pickFirst<
  // tuple of keys
  K extends readonly string[],
  // object type
  O extends Record<K[number], unknown>,
>(keyOrder: K, obj: O): O[K[number]] {
  for (const k of keyOrder) if (k in obj) return obj[k as K[number]]
  throw new Error("no key found")
}

function tupleToObject<const T extends readonly string[]>(t: T): { [K in T[number]]: true } {
  // eslint-disable-next-line prefer-object-spread
  return Object.assign({}, ...t.map((k) => ({ [k]: true })))
}

export function joinLines(prefix: string | undefined = ">", ...lines: string[]): string {
  return lines.map((l) => `${prefix} ${l}`).join("\n")
}

export function toDate(timestamp: number): Date
export function toDate(iso: string): Date
export function toDate(x: number | string): Date {
  return new Date(x)
}

type Parser<T> = { parse(input: unknown): T }
export async function loadParsed<T>(url: string, parser: Parser<T>): Promise<T> {
  const data = await (await fetch(url)).json()
  return parser.parse(data)
}

export function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((x) => typeof x === "string")
}

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`)
}

function withThis(this: HTMLElement, value: string) {
  this.textContent = value
}

type InitConf = typeof _initConf
type ConfigKey = keyof InitConf
type Config = { [K in ConfigKey]: NonNullable<InitConf[K]> }

const _initConf = {
  someConfig: "default value",
} as const

let _config: Config

function assertConfigFullyDefined(config: InitConf): asserts config is Config {
  let key: ConfigKey
  for (key in config) {
    if (config[key] === undefined) {
      throw new Error(`Missing config for ${key}`)
    }
  }
}

export function getConfig(): Config {
  if (!_config) {
    assertConfigFullyDefined(_initConf)
    _config = _initConf
  }

  return _config
}

class Timer {
  private start = performance.now()

  /** Returns the elapsed milliseconds since construction or last `reset()` */
  elapsed(): number {
    return performance.now() - this.start
  }

  /** Waits `ms` milliseconds, then resets the timer */
  async tick(ms: number): Promise<void> {
    await new Promise<void>((r) => setTimeout(r, ms))
    this.reset()
  }

  reset(): void {
    this.start = performance.now()
  }

  // Static helper — also must remain unchanged
  static format(ms: number): string {
    return `${ms.toFixed(1)} ms`
  }
}
