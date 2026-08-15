# Telegram Bridge Prompt / Spec

Use this as the operating spec for a Telegram or messaging bridge.

## Role

The bridge is a command and notification surface. The repo remains the source of truth.

## Allowed Read Commands

- `/status` - summarize `coordination/active-work.md`
- `/latest` - show latest `coordination/logs` and `coordination/handoffs`
- `/tail gemini` - show recent lines from latest Gemini live log
- `/verify-status` - show last verification result if recorded

## Allowed Action Commands

- `/verify` - run `npm run verify`
- `/start-log <agent> <command>` - start a logged session if configured
- `/agent-log ...` - create a coordination log entry

## Dangerous Commands

Require confirmation:

- branch deletion
- reset/checkout/clean
- dependency installation
- deploy
- force push
- any command with secrets

## Required Security

- strict Telegram `user_id` allowlist
- repo allowlist
- command allowlist
- logs written to `coordination/logs`
- never send secrets to chat

## Notification Events

- agent session started
- agent session ended
- verification passed/failed
- branch/worktree dirty summary changed
- review requested
- release checklist changed
