import { Command } from "commander";
import { ui } from "../ui/output";

export const agentCommand = new Command("agent")
  .description("Run an AI agent with a given prompt")
  .requiredOption("-p, --prompt <text>", "The task prompt for the agent")
  .option("--model <model>", "Override the active model for this run")
  .option("--cwd <path>", "Working directory of the agent", process.cwd())
  .action(async (options: { prompt: string; model?: string; cwd: string }) => {
    try {
      const { runAgent } = await import("../lib/agent/loop")
      await runAgent({ prompt: options.prompt, model: options.model, cwd: options.cwd })
    } catch (err) {
      ui.error((err as Error).message)
      process.exit(1)
    }
  })

