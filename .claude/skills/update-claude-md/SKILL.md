---
name: update-claude-md
description: Review and update this repo's CLAUDE.md after a change lands, so its guidance stays true. Use this whenever a fix, refactor, dependency change, or convention change has just been made and CLAUDE.md might now be wrong or incomplete — and especially when you hit a non-obvious gotcha, changed a shared convention (theme tokens, strings, API layer, navigation), added or removed a config value, or discovered a build/environment trap. Also use it when the user says "update CLAUDE.md", "document this", "record this for next time", or asks why CLAUDE.md disagrees with the code. Reach for it proactively at the end of any task that touched project-wide behaviour, rather than waiting to be asked.
---

# Keeping CLAUDE.md true

`CLAUDE.md` is loaded into the context of **every** session in this repo. That makes it the
highest-leverage file here, and also the easiest to ruin. Two failure modes matter:

- **Stale guidance is worse than no guidance.** A future session will trust a wrong statement and
  build on it. Correcting a line that has become false is the single most valuable edit you can make.
- **Bloat dilutes.** Every line competes for attention. A file that logs every change stops being
  read carefully, and the real constraints get lost in the noise.

So this is not a changelog. It is a short, current, opinionated description of how this codebase
actually behaves. Edit it in place; do not append history.

## Step 1 — decide whether anything belongs in the file at all

Most fixes teach a future session nothing. Being willing to write nothing is what keeps the file
worth reading.

**Record it** when the change means a future session would otherwise get it wrong:

- A **gotcha** that costs real time to rediscover — a build step that fails for a non-obvious reason,
  a value that must be set in two places, a name that lies about what it holds.
- A **convention** changed or established — where colours, copy, icons, endpoints, or navigation
  params are supposed to come from.
- A **constraint** that is not visible in the code — why something is done the odd way, what breaks
  if you "fix" it.
- A **command or config** that changed — how to build, validate, or configure the app.
- Anything that makes an **existing line in CLAUDE.md false**. This one is mandatory; see Step 2.

**Skip it** when:

- The code and its names already say it. CLAUDE.md is not documentation of the obvious.
- `git log` already records it. "Fixed the crash on the profile screen" belongs in a commit message.
- It is one screen's local detail with no bearing on how anyone works elsewhere.
- It is a bug you fixed and nobody could hit again — the fix is the record.
- It restates something CLAUDE.md already says. Improve the existing line instead of adding a second.

If nothing qualifies, say so plainly — "no CLAUDE.md change needed, the fix is self-describing" — and
stop. That is a good outcome, not a failure.

## Step 2 — hunt for statements the change just falsified

Do this before writing anything new, because it is the part people skip and the part that matters
most. Read CLAUDE.md against the change and look for lines that are now wrong.

Deletion and correction count as updates. A gotcha that has been fixed must be **removed**, not
annotated — leaving "note: X is hardcoded" next to code where X is no longer hardcoded actively
misleads the next session.

Practical way to catch these: grep the file for the identifiers you touched.

```bash
grep -nE 'COLORS|STRINGS|API_CONFIG|baseApi|endPoints|AppNavigator|prebuild' CLAUDE.md
```

Then verify each hit still holds. If a line claims a file or flag exists, confirm it does before
leaving it in place.

## Step 3 — put it in the right section

CLAUDE.md is already organised, and edits belong inside that structure rather than bolted on the end.
The current top-level shape is:

| Section | What lives there |
|---|---|
| **Project** | One-paragraph description of the app and stack |
| **Commands** | How to run, build, validate; which commands do *not* work |
| **Environment / config** | Env vars, `src/config/constants.ts`, the theme, build traps |
| **Architecture** | Provider hierarchy, state, API layer, auth, navigation, chat, payments, styling conventions |
| **Directory map** | What lives in each folder under `src/` |

Match the surrounding voice. The file already uses short declarative sentences, backticked
identifiers, and bolded `**Gotcha:**` prefixes for traps. Follow that instead of inventing a format.

Add a new section only when a genuinely new area of the codebase appears. Prefer one sharp sentence
in the right existing section over a new heading.

## Step 4 — write it so it stays useful

- **State the current truth, not the transition.** Write "the API base URL is hardcoded in
  `src/config/constants.ts`", not "changed the API base URL to be hardcoded".
- **No dates, no version numbers, no "recently".** They rot. If timing genuinely matters, the fact
  belongs in a commit message or an issue.
- **Point at the file.** A future session acts on `src/config/strings.ts`, not on a vague noun.
- **Lead with the trap.** If the point is that something is surprising, say so first — that is what
  makes the reader stop and look.
- **One or two sentences.** If it needs a paragraph, it probably needs to be a reference doc that
  CLAUDE.md links to instead.

Good:

> **Gotcha:** `pod install` fails on this machine unless the shell is UTF-8 (`export
> LANG=en_US.UTF-8`); Expo reports it only as a generic "pod install failed".

Bad:

> Fixed the iOS build on 21 Aug by running pod install with a different locale after it kept
> crashing, see the audit doc for more details.

The second one is dated, describes an event rather than a rule, and makes the reader go elsewhere to
learn what to do.

## Step 5 — check your work

- Re-read the edited section start to finish. Does it still read as one coherent piece, or did you
  staple a sentence onto it?
- Search for the same claim elsewhere in the file. Two statements of one rule will drift apart.
- Confirm every path, command, and flag you mentioned actually exists.
- Note the file's length. This file is deliberately short. If it grew, ask what you can now cut —
  guidance that has been superseded is dead weight.

Then tell the user, in one or two lines, what you changed and what you deliberately left out. The
"left out" half matters: it shows the file is being curated rather than accumulated.

## When the change is too big for CLAUDE.md

Some findings are worth keeping but too long to live here — a full audit, a migration plan, a
subsystem walkthrough. Put those in their own markdown file at the repo root or under `docs/`, and
add **one line** in CLAUDE.md pointing to it. `BOLIC-STATIC-AUDIT.md` is the existing example of this
pattern. That keeps CLAUDE.md scannable while the detail stays discoverable.
