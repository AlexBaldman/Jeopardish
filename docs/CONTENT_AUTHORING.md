# JeoPARODY Content Authoring

See also [Episode and Editorial Playbook](EPISODE_AND_EDITORIAL_PLAYBOOK.md) for
the product rationale, episode factory, house voice, and cross-discipline review
lenses behind this contract.

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
clue text, canonical answer, reviewed explanation, at least one HTTPS source,
and a reviewed `learning.reinforcement` memory check. Add accepted aliases only
when they are factually equivalent. Media may use HTTPS or a shipped local path
and must include useful title/alt text.

`learning.backstory` and `learning.connections` feed grounded Study mode.
`learning.reinforcement` makes that exploration retrievable:

```json
{
  "learning": {
    "backstory": "...",
    "connections": ["..."],
    "reinforcement": {
      "prompt": "A short retrieval prompt that does not reveal the answer",
      "answer": "Canonical English answer",
      "acceptedAnswers": ["Reviewed English alias"],
      "explanation": "Brief feedback after the attempt",
      "promptPt": "Reviewed Brazilian Portuguese prompt",
      "answerPt": "Canonical Brazilian Portuguese answer",
      "acceptedAnswersPt": ["Reviewed Portuguese alias"],
      "explanationPt": "Brief Portuguese feedback"
    }
  }
}
```

Both locales are required for a reviewed pack. Reinforcement answers use the
same deterministic exact, variation, and typo-tolerant judge as the main game.
Do not turn a broad topic into a vague memory check: the prompt, canonical
answer, aliases, and explanation must describe one reviewable fact.

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
6. Write and verify one bilingual reinforcement prompt and its accepted aliases.
7. Preflight local and remote media; never rely on media to carry the only
   answerable fact.
8. Read the clue aloud, test gameplay and reinforcement variants, and inspect both
   languages.
9. Validate the full pack and play its opening, media clue, Study detour,
   memory rematch, completion review queue, and finale before changing
   `reviewStatus` to `reviewed`.

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
and `assets/episodes`; transport failure uses the embedded reviewed emergency
broadcast rather than the historical runtime bank.
