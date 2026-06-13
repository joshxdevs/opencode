import { ui } from "../../ui/output"
import { getConfig } from "../config"
import { getProvider } from "../providers"
import { runTool, tools } from "./tools"
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";


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
    modelId: string,
    apiKey: string,
    messages: Array<{ role: string; content: string }>
): Promise<{ type: "text" | "tool_call"; content: string; tool?: string; args?: Record<string, unknown> }> {
    const [, geminiModel] = modelId.split("/");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: geminiModel,
        tools: [
            {
                functionDeclarations: tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: t.parameters as any,
                        required: Object.keys(t.parameters),
                    },
                })),
            },
        ],
    });
    const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));
    const chat = model.startChat({ history });
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    const response = result.response;
    const fnCall = response.functionCalls()?.[0];
    if (fnCall) {
        return {
            type: "tool_call",
            content: "",
            tool: fnCall.name,
            args: fnCall.args as Record<string, unknown>,
        };
    }
    return { type: "text", content: response.text() };
}