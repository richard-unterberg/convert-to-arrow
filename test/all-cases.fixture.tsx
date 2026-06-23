export { distantOne }
// separated export list kept away from the declaration
export { distantTwo }

function localAdd(a: number, b: number): number {
  return a + b
}

/**
 * Returns a random integer in [0, max)
 * @param max exclusive upper bound
 */
export function randInt(max: number): number {
  return Math.floor(Math.random() * max)
}

export default async function fetchJson(url: string) {
  const res = await fetch(url)
  return (await res.json()) as unknown
}

function distantOne() {
  return true
}

export const existingArrow = () => {
  return false
}

function distantTwo() {
  return true
}

export function pickFirst<
  // tuple of keys
  K extends readonly string[],
  // object type
  O extends Record<K[number], unknown>,
>(keyOrder: K, obj: O): O[K[number]] {
  for (const key of keyOrder) if (key in obj) return obj[key as K[number]]
  throw new Error("no key found")
}

export function identity<T>(value: T): T {
  return value
}

export function joinLines(prefix: string | undefined = ">", ...lines: string[]): string {
  return lines.map((line) => `${prefix} ${line}`).join("\n")
}

function describe({ name, count = 0 }: { name: string; count?: number }): string {
  return `${name}: ${count}`
}

export function isStringArray(arr: unknown[]): arr is string[] {
  return arr.every((item) => typeof item === "string")
}

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`)
}

export function toDate(timestamp: number): Date
export function toDate(iso: string): Date
export function toDate(x: number | string): Date {
  return new Date(x)
}

function* counter() {
  yield 1
}

class Timer {
  elapsed(): number {
    return 1
  }
}

const api = {
  getValue(): number {
    return 1
  },
}

function withThis(this: HTMLElement, value: string) {
  this.textContent = value
}

function assertConfigFullyDefined(config: { value?: string }): asserts config is { value: string } {
  if (config.value === undefined) throw new Error("Missing value")
}

declare function ambientFunction(value: string): string

function render(this: HTMLElement) {
  return this.textContent
}

function collect() {
  // biome-ignore lint/style/noArguments: intentional skip coverage for function-only semantics
  return arguments.length
}

function Constructable() {
  return new.target
}

const expression = function namedExpression() {
  return 2
}
