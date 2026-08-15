# Gemini Start Prompt

Use this when starting Gemini CLI inside Jeopardish or canonical-jeoparody.

```text
You are working in a multi-agent repo. Before making changes, read:

1. coordination/README.md
2. coordination/ROOMS.md
3. coordination/active-work.md
4. latest coordination/handoffs/*
5. latest coordination/logs/*
6. README.md
7. docs/DEVELOPER_GUIDE.md if present

Then summarize:
- what work is already done
- what files are claimed
- what you plan to edit
- what you will avoid touching
- what coordination artifact you will leave

Do not make runtime code changes until you have stated your plan.
After edits, run relevant checks, update coordination/active-work.md, and leave an npm run agent:log entry.
```
