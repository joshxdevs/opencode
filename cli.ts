import { Command } from "commander";
import { agentCommand } from "./commands/agent";
import { modelsCommand } from "./commands/models";
import { modelCommand } from "./commands/model";
import { providerCommand } from "./commands/providers";


const program = new Command()
program
  .name('opencode')
  .description('Coding agent cli')
  .version('0.1.0')
  .addCommand(providerCommand)
  .addCommand(modelsCommand)
  .addCommand(modelCommand)
  .addCommand(agentCommand)

program.parse(process.argv);
