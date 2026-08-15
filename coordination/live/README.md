# Live Agent Sessions

Use this folder for live terminal transcripts and real-time status files. This is how one agent can watch another agent's work without needing direct access to its terminal UI.

## Start A Logged Session

Preferred:

```bash
npm run agent:session -- --agent Gemini --command gemini
```

This writes a timestamped log under `coordination/live/`.

Direct shell fallback:

```bash
script -q coordination/live/gemini-$(date -u +%Y%m%dT%H%M%SZ).log gemini
```

Pipe fallback:

```bash
gemini 2>&1 | tee coordination/live/gemini-$(date -u +%Y%m%dT%H%M%SZ).log
```

## Review A Live Session

Ask another agent:

```text
Read the latest coordination/live/gemini-*.log and review what Gemini is doing.
Flag risks, missed assumptions, duplicated work, and suggested course corrections.
Do not edit files unless explicitly asked.
```

## Naming Convention

```text
coordination/live/YYYYMMDDTHHMMSSZ-agent-task.log
coordination/live/agent-current.log
```

The timestamped log is immutable. The optional `agent-current.log` can be overwritten by wrapper scripts for dashboards and Telegram bridges.

## Safety

- Do not log secrets, API keys, auth codes, or private credentials.
- Do not expose live logs publicly.
- If a command might print secrets, do not run it inside a live transcript.
- Prefer summaries in `coordination/logs/` for durable history.
