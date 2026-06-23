#!/usr/bin/env bash

set -euo pipefail

COUNT="${1:-200}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/convert-to-arrow-bench.XXXXXX")"
SRC="$TMP/source.ts"

trap 'rm -rf "$TMP"' EXIT

cat > "$SRC" <<'TS'
function add(a: number, b: number): number {
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

export function pickFirst<
  K extends readonly string[],
  O extends Record<K[number], unknown>,
>(keyOrder: K, obj: O): O[K[number]] {
  for (const key of keyOrder) if (key in obj) return obj[key as K[number]]
  throw new Error("no key found")
}
TS

echo "📄  Generating $COUNT copies of $SRC → $TMP/"

for i in $(seq 1 "$COUNT"); do
  cp "$SRC" "$TMP/fixture_$i.ts"
done

echo "🚀  Running codemod on $COUNT files…"
START_MS=$(node -p "Date.now()")

printf "y\n" | npm run dev -- "$TMP"  > /dev/null
END_MS=$(node -p "Date.now()")

ELAPSED=$((END_MS - START_MS))
echo "⏱ Finished in ${ELAPSED} ms"
