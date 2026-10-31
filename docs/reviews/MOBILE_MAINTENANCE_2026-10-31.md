# October 31 public-cabinet mobile maintenance

Scope: the preserved public URL https://alexbaldman.github.io/Jeopardish/ on
top of master `920943c`. The canonical trivia product remains
[AlexBaldman/jeoPARODY](https://github.com/AlexBaldman/jeoPARODY).

## Changes

The narrow-cabinet answer input used a 0.52–0.7rem clamp (roughly 8–11px at
a 16px root). Keep it at least 16px for legibility and to avoid the small-input
Safari zoom trigger. New clues no longer programmatically focus the answer
field on touch/coarse-pointer devices. Players tap when ready to type.
Desktop automatic focus and prevent-scroll behavior remain.

Keep the existing artwork, host geometry, dialogue connectors, skins, gameplay,
local storage and scoring. Bump the two changed asset references in both source
HTML entrypoints so returning visitors request the updated files. Input hints
disable spelling/capitalization changes and show a Done key where supported.

## Verification and limits

The existing 112-state Chromium/WebKit mobile gate now also checks phone input
font size and absence of automatic focus. The complete existing PR/release
workflow remains enabled. CI results and release SHA belong to the associated
PR/run; no local pass is claimed because the computer connection became
unavailable during this session.

The October 11 run already passed validation and deployed #67. Its WebKit
post-deploy Ask Host timeout reproduced on October 31 when only failed jobs
were rerun. That is an unresolved canary defect, not proof that deployment
failed and not a reason to suppress the check.

Physical iPhone Safari keyboard, zoom, safe areas and rotation still need
device acceptance. Chromium/WebKit emulation does not certify hardware.

## Consolidation

This is bounded maintenance of an existing public surface while canonical
PR #77 repairs accessibility, menu/settings behavior and phone layout. No old
controller is merged into the canonical source. The canonical release is also
blocked by its Pages Source setting (`legacy` rather than `workflow`); the
setting requires administrator access. Preserve this URL until the canonical
artifact and an intentional URL transition pass acceptance.
