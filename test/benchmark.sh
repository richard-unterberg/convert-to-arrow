#!/usr/bin/env bash
# bench.sh  [COUNT]             (default COUNT = 500)
#
# Creates COUNT copies of tests/fixtures.ts, runs the codemod,
# measures the runtime, then deletes the temp files.

set -euo pipefail

COUNT="${1:-500}"               # how many copies to create
SRC="test/fixtures.ts"         # source fixture
TMP="test/tmp-bench"           # temp dir (auto-deleted)

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
# pass the temp dir as positional arg to the CLI
printf "y\n" | npm run dev -- "$TMP"  > /dev/null
END_MS=$(node -p "Date.now()")

ELAPSED=$((END_MS - START_MS))
echo "⏱ Finished in ${ELAPSED} ms"

echo "🧹  Cleaning up"
rm -rf "$TMP"
