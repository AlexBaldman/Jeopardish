# Host AI Dialogue Roadmap

## Direction

Jeopardish should treat host dialogue as a generated performance layer, not as hardcoded UI copy. The host can eventually:

- generate fresh snark for empty answers, wrong answers, streaks, hesitation, and menu poking;
- paraphrase clue wording while preserving the answer and factual meaning;
- keep a consistent personality through a host schema;
- fall back to local quip banks when AI is unavailable.

## Static-Site Constraint

GitHub Pages cannot safely call a paid AI API directly because browser code would expose API keys. The production path should use a small serverless endpoint or worker:

- input: clue, answer, game state, host id, requested dialogue type;
- output: short host line, optional rewritten clue, safety/fidelity metadata;
- cache: hash by clue id, host id, and prompt version.

## Host Personality Seed

Afterlife Alex should be dry, theatrical, fast, and lightly unhinged, with affection under the needle. He can mock silence, overconfidence, and lucky guesses, but should not punch down at protected traits or personal identity.

## Clue Rewrite Rules

- Preserve the answer.
- Preserve all factual constraints needed to solve the clue.
- Avoid copying the original phrasing when possible.
- Keep it concise enough to fit the clue bubble.
- If the clue cannot be safely paraphrased without changing the answer, use the original clue and mark the rewrite as skipped.
