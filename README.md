# modelinfo — a fast CLI to explore AI model capabilities, pricing, limits, and provider metadata.

`modelinfo` is a Bun-first TypeScript CLI for exploring AI model metadata from [PublicProviderConf](https://github.com/ThinkInAIXYZ/PublicProviderConf). It keeps a local normalized index for fast lookups, ships with a bundled seed dataset so a fresh install can work offline, and refreshes from upstream when the version file changes.

## Features

- Fast default lookup with local normalized index
- Fuzzy search across models and providers
- Provider listing and per-provider model listing
- Side-by-side model diff
- Focused capability, cost, and limit views
- Local cache with bundled seed files
- Auto refresh using the upstream version file

## Requirements

- Bun 1.0+
- Node.js 20+ for running the published CLI package

## Install

```bash
bun install
```

## Development

```bash
bun run build:seed
bun run build
bun run dev -- --help
bun run test
bun run lint
```

The first local cache is copied from the packaged `seed/` directory into `~/.modelinfo/`. After that, `modelinfo` uses `~/.modelinfo/index.json` for normal reads and checks the remote version file periodically.

## Usage

```bash
modelinfo gpt-4o
modelinfo search qwen
modelinfo providers
modelinfo list 302ai
modelinfo diff gpt-4o gpt-4
modelinfo caps gpt-4o
modelinfo cost gpt-4o
modelinfo limit gpt-4o
modelinfo update
modelinfo doctor
modelinfo gpt-4o --output json
```

### Provider filters

Most model commands accept `--provider` to narrow duplicate model ids:

```bash
modelinfo gpt-4o --provider openai
modelinfo search gpt --provider openrouter
modelinfo cost gpt-4o --provider openai
modelinfo diff gpt-4o gpt-4.1 --provider-a openai --provider-b openai
modelinfo search qwen --provider openrouter --output json
```

## Cache layout

```text
~/.modelinfo/
  all.json
  version.json
  index.json
```

Bundled seed files are published inside the npm package:

```text
seed/
  all.json
  version.json
  index.json
```

## Commands

- `modelinfo <model>`: resolve and show a model
- `modelinfo search <keyword>`: fuzzy search models
- `modelinfo providers`: list providers
- `modelinfo list <provider>`: list models under a provider
- `modelinfo update`: refresh local cache if upstream changed
- `modelinfo diff <modelA> <modelB>`: compare two models
- `modelinfo caps <model>`: show capabilities only
- `modelinfo cost <model>`: show pricing only
- `modelinfo limit <model>`: show token limits only
- `modelinfo doctor`: show cache and version status

## Publish

```bash
bun run build:seed
bun run build
npm publish
```

`prepack` already runs the seed build and TypeScript build, so a regular `npm publish` includes `dist/` and `seed/`.
