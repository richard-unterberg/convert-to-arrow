#!/usr/bin/env bash

set -euo pipefail

COUNT="${1:-200}"
SRC="test/fixtures.ts"        
TMP="test/tmp-bench"  

if [[ ! -f "$SRC" ]]; then
  echo "❌  $SRC not found"; exit 1
fi

echo "📄  Generating $COUNT copies of $SRC → $TMP/"
rm -rf "$TMP"
mkdir -p "$TMP"

for i in $(seq 1 "$COUNT"); do
  cp "$SRC" "$TMP/fixture_$i.ts"
done

echo "🚀  Running codemod on $COUNT files…"
START_MS=$(node -p "Date.now()")

printf "y\n" | npm run dev -- "$TMP"  > /dev/null
END_MS=$(node -p "Date.now()")

ELAPSED=$((END_MS - START_MS))
echo "⏱ Finished in ${ELAPSED} ms"

echo "🧹  Cleaning up"
rm -rf "$TMP"
