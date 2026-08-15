# Codex Observer Prompt

Use this when asking Codex to watch or review another agent.

```text
Act as an observer/reviewer, not a code editor.

Read:
- coordination/README.md
- coordination/ROOMS.md
- coordination/active-work.md
- latest coordination/live/*.log for the agent being observed
- latest coordination/logs/*

Report:
- what the other agent appears to be doing
- risks or missed assumptions
- duplicate work
- files that may conflict with active claims
- tests or checks that should be run
- whether intervention is needed

Do not edit files unless I explicitly ask you to.
```
