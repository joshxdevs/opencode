import { ui } from "../../ui/output"
import { getConfig } from "../config"
import { getProvider } from "../providers"
import { runTool } from "./tools"


export interface AgentOptions {
    prompt: string,
    model?: string
    cwd: string,
}

export async function runAgent(opts: AgentOptions): Promise<void> {
    const config = getConfig()
    const modelId = opts.model ?? config.active_model

    if (!modelId) {
        throw new Error(
            `No model set. Run: opencode model set <provider/model-id>`
        )
    }

    const [providerName] = modelId.split("/")
    const providerCfg = getProvider(providerName)

    if (!providerCfg) {
        throw new Error(
            `No API key for "${providerName}". Run: opencode providers login --provider ${providerName} --api_key <key>`
        )
    }
    ui.info(`Model:     ${modelId}`)
    ui.info(`Cwd:       ${opts.cwd}`)
    console.log()

    const messages: Array<{ role: string, content: string }> = [
        {
            role: "system",
            content: `You are an expert software engineer. Working directory: ${opts.cwd}. Use tools to help the user.`,
        },
        { role: "user", content: opts.prompt },
    ]
    const MAX_ITERATIONS = 20
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const response = await callModel(modelId, providerCfg.api_key, messages)

        if (response.type === "text") {
            console.log("\n" + response.content)
            return
        }

        if (response.type === "tool_call" && response.tool) {
            ui.dim(`[tool] ${response.tool}(${JSON.stringify(response.args)})`);
            const result = await runTool(response.tool, response.args ?? {}, opts.cwd);
            ui.dim(`[result] ${result.slice(0, 200)}${result.length > 200 ? "…" : ""}`);
            messages.push({ role: "assistant", content: `Called: ${response.tool}` });
            messages.push({ role: "user", content: `Result: ${result}` });
        }
    }
    ui.warn("Reached maximum iterations without a final answer.");
}

async function callModel(
    _modelId: string,
    _apiKey: string,
    _messages: Array<{ role: string, content: string }>
): Promise<{
    type: "text" | "tool_call";
    content: string;
    tool?: string;
    args?: Record<string, unknown>;
}> {
    return {
        type: "text",
        content: "Placeholder response. Waiting to connect a real model.",
    };
}