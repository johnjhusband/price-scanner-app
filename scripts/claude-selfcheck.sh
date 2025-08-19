#!/usr/bin/env bash
set -euo pipefail
OATH='CLAUDE.md loaded — I solemnly swear I am up to no bugs.'
QUIPS_FILE="${1:-scripts/claude-quips.txt}"
if [[ ! -f "$QUIPS_FILE" ]]; then
  cat > "$QUIPS_FILE" <<'Q'
Today's goal: ship small, break nothing, impress future me.
Compiling optimism… success.
Feature flags: because reality needs if‑statements.
My love language is passing tests.
I refuse to debug in prod. My therapist agrees.
Refactors are just apologies to future maintainers.
Latency is a feature. (Kidding.)
Coffee: true; Deploy: false.
I only YOLO in dev.
In logs we trust; all else bring repro steps.
Q
fi
QUIP="$(shuf -n1 "$QUIPS_FILE" 2>/dev/null || gshuf -n1 "$QUIPS_FILE" 2>/dev/null || awk 'BEGIN{srand()} {a[NR]=$0} END{print a[int(rand()*NR)+1]}' "$QUIPS_FILE")"
echo "$OATH"
echo "Quip: $QUIP"