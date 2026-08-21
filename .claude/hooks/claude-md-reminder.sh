#!/bin/sh
# Stop hook: nudge to review CLAUDE.md when source changed but CLAUDE.md did not.
#
# Emits a systemMessage (visible reminder) rather than blocking. Blocking would
# be wrong here: "no CLAUDE.md change needed" is a legitimate outcome of the
# update-claude-md skill, and a blocking hook would loop forever on it.
#
# Exits silently and successfully in every other case, so it never interrupts.

set -u

# Not a git repo, or git unavailable — nothing to compare against.
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Paths whose change plausibly affects project-wide guidance. Screen-local
# tweaks under src/screens still land here, and that is fine — the reminder is
# a prompt to think, not an instruction to write.
WATCHED="src package.json app.json eas.json .npmrc babel.config.js metro.config.js tsconfig.json"

changed=$(git status --porcelain -- $WATCHED 2>/dev/null)
[ -n "$changed" ] || exit 0

# Already curated this session — stay quiet.
doc=$(git status --porcelain -- CLAUDE.md 2>/dev/null)
[ -z "$doc" ] || exit 0

count=$(printf '%s\n' "$changed" | grep -c .)

printf '{"systemMessage":"%s"}\n' \
  "$count changed file(s) under src/ or project config, but CLAUDE.md is untouched. If this work added a gotcha, changed a convention, or made an existing line in CLAUDE.md false, run /update-claude-md. If it taught a future session nothing, ignore this."
