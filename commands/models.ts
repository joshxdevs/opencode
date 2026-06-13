import { Command } from "commander";
import { ui } from "../ui/output";
import { getModels } from "../lib/models";

export const modelsCommand = new Command("models")
  .description("List all the models from models.dev")
  .option("--provider <name>", "Filter by provider")
  .option("--refresh", "Force refresh the local cache")
  .action(async (options: { provider?: string, refresh?: boolean }) => {
    ui.info("Fetching models...")

    try {
      const data = await getModels(options.refresh)
      const providers = Object.values(data)
      const filtered = options.provider ? providers.filter((p) =>
        p.id === options.provider ||
        p.name.toLowerCase() === options.provider?.toLowerCase()
      ) : providers

      if (filtered.length === 0) {
        ui.warn(`No provider found matching "${options.provider}"`)
        return
      }

      for (const provider of filtered) {
        ui.header(`\n${provider.name} (${provider.id})`)
        for (const model of Object.values(provider.models)) {
          const tags = [
            model.reasoning ? "reasoning" : "",
            model.tool_call ? "tools" : "",
          ]
            .filter(Boolean)
            .join(", ");
          const cost = model.cost
            ? `$${model.cost.input}/$${model.cost.output}/MTok`
            : "";
          console.log(`  ${model.id.padEnd(45)} ${tags.padEnd(20)} ${cost}`)
        }
      }
      const total = providers.reduce((n, p) => n + Object.keys(p.models).length, 0)
      console.log(`\n${total} models across ${providers.length} providers.`);

    } catch (err) {
      ui.error((err as Error).message)
      process.exit(1)
    }
  })

