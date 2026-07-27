# JeoPARODY Content Authoring

Production episodes are small, reviewed JSON packs. The historical question
archive is research material and a runtime fallback; it is not the editorial
model for a finished broadcast.

## Required Episode Shape

Every authored pack must declare:

- `schemaVersion`, stable `id`, `title`, `locale`, and `kind: "authored"`;
- `sequenceMode: "authored-order"` so performance and story beats remain paced;
- positive `contentRevision`; increment it whenever saved progress would no
  longer refer to the same clue sequence or truth;
- `reviewStatus: "reviewed"` for the production path;
- `episodeLength`, provenance, optional finale, and a unique clue list.

Every production clue requires a stable id, category, integer value, original
clue text, canonical answer, reviewed explanation, and at least one HTTPS
source. Add accepted aliases only when they are factually equivalent. Media may
use HTTPS or a shipped local path and must include useful title/alt text.

`learning.backstory` and `learning.connections` feed grounded Study mode.
`performance.act`, `expression`, `hostLine`, `storyBeat`, and `callbackTo`
shape the authored show without changing truth or score.

An episode may include reviewed standby clues after `episodeLength`. They are
not part of the normal authored sequence; `SessionManager` offers them only as
non-reserved replacements when a scheduled clue cannot pass media preflight.
Choose a standby that preserves any story or finale contract affected by the
replaced clue.

See `questions/episodes/season-zero-001.json` for the executable reference.

## Editorial Pass

1. Write original clue wording from the factual source.
2. Verify the canonical answer and every accepted alias.
3. Attach the most direct institutional or primary source available.
4. Write an explanation that says why the answer is correct.
5. Add backstory and connections supported by the reviewed facts.
6. Preflight local and remote media; never rely on media to carry the only
   answerable fact.
7. Read the clue aloud, test typed and spoken variants, and inspect both
   languages.
8. Validate the full pack and play its opening, media clue, study detour, and
   finale before changing `reviewStatus` to `reviewed`.

AI may propose wording, jokes, aliases, or performance lines. It may not approve
sources, determine truth, expand accepted answers, or change score. A reviewed
human-authored pack remains the authority.

## Commands

```bash
node scripts/validate-questions.mjs questions/episodes/season-zero-001.json
node --test tests/authored-episode.test.mjs tests/episode-contract.test.mjs
npm run verify
```

The validator checks the contract, review requirements, HTTPS sources, and
existence of local media. The production manifest ships `questions/episodes`
and `assets/episodes` alongside the compact archive fallback.
