#!/usr/bin/env node

import { Command, Option } from "commander";

import { APP_NAME, APP_VERSION } from "./core/config.js";
import { isErrorWithMessage } from "./core/errors.js";
import { logError } from "./core/logger.js";
import { runCapsCommand } from "./commands/caps.js";
import { runCostCommand } from "./commands/cost.js";
import { runDiffCommand } from "./commands/diff.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runLimitCommand } from "./commands/limit.js";
import { runListCommand } from "./commands/list.js";
import { runProvidersCommand } from "./commands/providers.js";
import { runSearchCommand } from "./commands/search.js";
import { runShowCommand } from "./commands/show.js";
import { runUpdateCommand } from "./commands/update.js";

const program = new Command();
const knownCommands = new Set(["show", "search", "providers", "list", "update", "diff", "caps", "cost", "limit", "doctor", "help"]);

program
  .name(APP_NAME)
  .description("Explore AI model capabilities, pricing, limits, and provider metadata.")
  .version(APP_VERSION)
  .showHelpAfterError();

program
  .command("show")
  .argument("<model>", "Model id or name")
  .option("-p, --provider <provider>", "Filter by provider id/name/display_name")
  .action(async (model: string, options: { provider?: string }) => {
    await runShowCommand(model, options);
  });

program
  .command("search")
  .argument("<keyword>", "Keyword to search")
  .option("-p, --provider <provider>", "Filter by provider id/name/display_name")
  .addOption(new Option("--limit <number>", "Limit the number of rows").argParser((value) => Number.parseInt(value, 10)))
  .action(async (keyword: string, options: { provider?: string; limit?: number }) => {
    await runSearchCommand(keyword, options);
  });

program.command("providers").action(async () => {
  await runProvidersCommand();
});

program
  .command("list")
  .argument("<provider>", "Provider id or name")
  .action(async (provider: string) => {
    await runListCommand(provider);
  });

program.command("update").action(async () => {
  await runUpdateCommand();
});

program
  .command("diff")
  .argument("<modelA>", "Left model")
  .argument("<modelB>", "Right model")
  .option("--provider-a <provider>", "Provider filter for the left model")
  .option("--provider-b <provider>", "Provider filter for the right model")
  .action(async (modelA: string, modelB: string, options: { providerA?: string; providerB?: string }) => {
    await runDiffCommand(modelA, modelB, options);
  });

program
  .command("caps")
  .argument("<model>", "Model id or name")
  .option("-p, --provider <provider>", "Filter by provider id/name/display_name")
  .action(async (model: string, options: { provider?: string }) => {
    await runCapsCommand(model, options);
  });

program
  .command("cost")
  .argument("<model>", "Model id or name")
  .option("-p, --provider <provider>", "Filter by provider id/name/display_name")
  .action(async (model: string, options: { provider?: string }) => {
    await runCostCommand(model, options);
  });

program
  .command("limit")
  .argument("<model>", "Model id or name")
  .option("-p, --provider <provider>", "Filter by provider id/name/display_name")
  .action(async (model: string, options: { provider?: string }) => {
    await runLimitCommand(model, options);
  });

program.command("doctor").action(async () => {
  await runDoctorCommand();
});

try {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    program.help();
  }

  const argv =
    rawArgs[0] && !rawArgs[0].startsWith("-") && !knownCommands.has(rawArgs[0])
      ? [...process.argv.slice(0, 2), "show", ...rawArgs]
      : process.argv;

  await program.parseAsync(argv);
} catch (error) {
  logError(isErrorWithMessage(error) ? error.message : String(error));
  process.exitCode = 1;
}
