#!/usr/bin/env bash
set -euo pipefail

bun run src/cli.ts gpt-4o
bun run src/cli.ts search qwen --provider openrouter
bun run src/cli.ts providers
bun run src/cli.ts list openai
bun run src/cli.ts diff gpt-4o qwen-max --provider-a openai --provider-b openrouter
bun run src/cli.ts caps gpt-4o --provider openai
bun run src/cli.ts cost gpt-4o --provider openai
bun run src/cli.ts limit gpt-4o --provider openai
bun run src/cli.ts update
bun run src/cli.ts doctor
