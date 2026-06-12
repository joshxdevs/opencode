import { Command } from "commander";
import { ui } from "../ui/output";
import { getConfig, saveConfig } from "../lib/config";

export const modelCommand = new Command("model")
    .description("Manage the active model")

modelCommand.command("set <model>")
    .description("Set the active model (fromat: provider/model-id)")
    .action((modelId: string) => {
        if (!modelId.includes("/")) {
            ui.error(`Invalid format. Use: provider/model-id (e.g gemini-2-flash)`)
            process.exit(1)
        }
        const [provider] = modelId.split("/")
        const config = getConfig()
        config.active_model = modelId
        saveConfig(config)
        ui.success(`Active model set to: ${modelId}`);
        ui.dim(`Provider: ${provider}`);
    })