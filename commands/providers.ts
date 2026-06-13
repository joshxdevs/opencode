import { Command } from "commander";
import { ui } from "../ui/output";
import { getProviders, removeProvider, saveProvider } from "../lib/providers";

export const providerCommand = new Command("providers")
    .description("Manage AI Provider Credentials")

providerCommand.command("list")
    .description("List all the configured providers")
    .action(() => {
        const store = getProviders()
        const names = Object.keys(store)
        if (names.length === 0) {
            ui.warn("No providers configured.")
            ui.dim("Run: opencode providers login --provider <name> --api_key <key>")
            return
        }
        ui.header("Configured Providers:\n")
        console.log("provider        API Key")
        for (const name of names) {
            const key = store[name].api_key
            const masked = key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "****"
            console.log(`${name.padEnd(15)} ${masked}`)
        }
    })

providerCommand.command("login")
    .description("Add or update a provider API key")
    .requiredOption("--provider <name>", "Provider name (e.g. gemini, openai)")
    .requiredOption("--api_key <key>", "API for the provider")
    .action((options: { provider: string, api_key: string }) => {
        saveProvider(options.provider, { api_key: options.api_key })
        ui.success(`Provider "${options.provider}" saved.`)
        ui.dim(`Stored in ~/.opencode/providers.json`)
    })

providerCommand.command("logout")
    .description("Remove a provider's API key")
    .requiredOption("--provider <name>", "Provider name to remove")
    .action((options: { provider: string }) => {
        const removed = removeProvider(options.provider)
        if (removed) {
            ui.success(`Provider "${options.provider}" removed.`);
        } else {
            ui.error(`Provider "${options.provider}" not found.`);
            process.exit(1)
        }
    })

