# modelinfo — a fast CLI to explore AI model capabilities, pricing, limits, and provider metadata.

[![npm version](https://img.shields.io/npm/v/modelinfo.svg)](https://www.npmjs.com/package/modelinfo)
[![npm downloads](https://img.shields.io/npm/dm/modelinfo.svg)](https://www.npmjs.com/package/modelinfo)
[![CI](https://img.shields.io/github/actions/workflow/status/zerob13/modelinfo-cli/ci.yml?branch=master&label=ci)](https://github.com/zerob13/modelinfo-cli/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/modelinfo.svg)](https://github.com/zerob13/modelinfo-cli/blob/master/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![bun](https://img.shields.io/badge/bun-%3E%3D1.0-000000?logo=bun&logoColor=white)](https://bun.sh/)

`modelinfo` is a Bun-first TypeScript CLI for exploring AI model metadata from [PublicProviderConf](https://github.com/ThinkInAIXYZ/PublicProviderConf). It keeps a local normalized index for fast lookups, ships with a bundled seed dataset so a fresh install can work offline, and refreshes from upstream when the version file changes.

Links:

- npm package: [modelinfo](https://www.npmjs.com/package/modelinfo)
- Web version: [models.anya2a.com](https://models.anya2a.com/)
- Source: [zerob13/modelinfo-cli](https://github.com/zerob13/modelinfo-cli)

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

Install globally:

```bash
npm install -g modelinfo
```

Or run without installing:

```bash
bunx modelinfo gpt-4o
# or
npx modelinfo gpt-4o
```

For local development:

```bash
bun install
```

## Install as Agent Skill

Use with AI coding agents (Claude Code, Cursor, Codex, etc.):

```bash
npx skills add zerob13/modelinfo-cli
```

See [skills.sh](https://skills.sh) for more information.

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

If you prefer the web UI for the same dataset, use [models.anya2a.com](https://models.anya2a.com/).

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
bun release
```

`bun release` is an interactive release flow. It lets you choose the next version, publish to `latest` or `beta`, runs checks, creates a release commit and git tag, then publishes to npm.

For a manual publish without the helper:

```bash
bun run build:seed
bun run build
npm publish
```

`prepack` already runs the seed build and TypeScript build, so a regular `npm publish` includes `dist/` and `seed/`.

## Release automation

This repository includes GitHub Actions for CI and automated releases:

- `CI`: runs format check, lint, test, and build on pushes and pull requests
- `Release Please`: watches commits on `master`, opens or updates a release PR, and automatically bumps the version once the release PR is merged
- npm publish runs automatically after a release is created

Required GitHub secret:

- `NPM_TOKEN`: npm automation token with publish permission for `modelinfo`

Recommended commit style:

- `feat: add provider aliases`
- `fix: handle missing cache version`
- `chore: update dependencies`
