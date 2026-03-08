---
name: modelinfo-cli
description: Use when Codex needs to inspect, search, compare, or troubleshoot AI model metadata with the published modelinfo CLI. Trigger for tasks such as looking up a model, searching by keyword, listing providers, listing models under a provider, comparing two models, checking cache/update state, or producing JSON output from modelinfo commands. Use global `modelinfo`, `bunx modelinfo`, or `npx modelinfo`.
---

# modelinfo CLI

Run the CLI instead of guessing model metadata.

## Choose the execution path

- Prefer `modelinfo ...` when the CLI is already installed globally.
- Prefer `bunx modelinfo ...` for normal usage against the published package.
- Use `npx modelinfo ...` when Bun is unavailable but the published package should still be used.

## Start with these commands

- Inspect one model: `modelinfo <model>` or `bunx modelinfo <model>`
- Inspect one model with provider filter: `modelinfo <model> --provider <provider>`
- Search models: `modelinfo search <keyword>`
- Search as JSON: `modelinfo search <keyword> --output json`
- List providers: `modelinfo providers`
- List one provider's models: `modelinfo list <provider>`
- Compare two models: `modelinfo diff <modelA> <modelB>`
- Show capabilities only: `modelinfo caps <model>`
- Show pricing only: `modelinfo cost <model>`
- Show limits only: `modelinfo limit <model>`
- Refresh local cache: `modelinfo update`
- Inspect cache health: `modelinfo doctor`

## Resolve ambiguity correctly

- Do not assume `model_id` is unique across providers.
- If a lookup returns multiple rows, rerun with `--provider <provider>`.
- For `diff`, use `--provider-a` and `--provider-b` when either side is ambiguous.
- Prefer `--output json` when the user wants structured data, exact fields, or follow-up processing.

## Use JSON output for agent workflows

- Single model: `modelinfo <model> --provider <provider> --output json`
- Search results: `modelinfo search <keyword> --provider <provider> --output json`
- Provider model list: `modelinfo list <provider> --output json`
- Cache status: `modelinfo doctor --output json`
- Update summary: `modelinfo update --output json`

## Minimal workflow

1. If the user asks about one model, run `modelinfo <model>` first, or `bunx modelinfo <model>` if the CLI is not installed.
2. If the result is ambiguous, rerun with `--provider` or present the candidate rows.
3. If the user needs machine-readable output, rerun the same command with `--output json`.
4. If the cache looks stale or missing, run `modelinfo doctor`, then `modelinfo update` if needed.
