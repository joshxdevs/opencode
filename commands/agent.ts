import { Command } from "commander";
import { ui } from "../ui/output";

export const agentCommand = new Command("agent")
  .description("Run an AI agent with a given prompt")
  .requiredOption("-p, --prompt <text>", "The task prompt for the agent")
  .option("--model <model>", "Override the active model for this run")
  .option("--cwd <path>", "Working directory of the agent", process.cwd())
  .action(async (_options) => {

  })

