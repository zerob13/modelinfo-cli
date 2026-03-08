---
name: modelinfo-cli
description: Use when Codex needs to inspect, search, compare, or troubleshoot AI model metadata with the modelinfo CLI in this repository or from an installed package. Trigger for tasks such as looking up a model, searching by keyword, listing providers, listing models under a provider, comparing two models, checking cache/update state, or producing JSON output from modelinfo commands. Do not use for editing the CLI implementation itself unless the task also requires running the CLI to verify behavior.
---

# modelinfo CLI

Run the CLI instead of guessing model metadata.

## Choose the execution path

- Prefer `bun run src/cli.ts ...` while working inside this repository and before rebuilding.
- Use `node dist/cli.js ...` or `bun run dist/cli.js ...` after `bun run build`.
- Use `bunx modelinfo ...` or `npx modelinfo ...` when the package is installed and repository paths are not relevant.

## Start with these commands

- Inspect one model: `modelinfo <model>`
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

1. If the user asks about one model, run `modelinfo <model>` first.
2. If the result is ambiguous, rerun with `--provider` or present the candidate rows.
3. If the user needs machine-readable output, rerun the same command with `--output json`.
4. If the cache looks stale or missing, run `modelinfo doctor`, then `modelinfo update` if needed.
