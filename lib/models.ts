import { join } from "path";
import { CONFIG_DIR, readConfigFile, writeConfigFile } from "./config";
import { existsSync, statSync, writeFile } from "fs";


const MODELS_API = "https://models.dev/api.json"
const CACHE_FILE = "models-cache.json"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export interface modelInfo {
    id: string;
    name: string;
    family?: string;
    reasoning?: boolean;
    tool_call?: boolean;
    limit?: { context: number; output: number };
    cost?: { input: number; output: number };
}

export interface ProviderData {
    id: string;
    name: string;
    models: Record<string, modelInfo>
}

export type ModelsData = Record<string, ProviderData>

export function isCacheStale(): boolean {
    const cacheFile = join(CONFIG_DIR, CACHE_FILE)
    if (!existsSync(cacheFile)) return true
    const age = Date.now() - statSync(cacheFile).mtimeMs
    return age > CACHE_TTL_MS
}

export async function getModels(forceRefresh = false): Promise<ModelsData> {
    if (!forceRefresh && !isCacheStale()) {
        const cached = readConfigFile<ModelsData>(CACHE_FILE)
        if (cached) return cached
    }
    try {
        const res = await fetch(MODELS_API)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as ModelsData
        writeConfigFile(CACHE_FILE, data)
        return data
    } catch {
        const cached = readConfigFile<ModelsData>(CACHE_FILE)
        if (cached) {
            console.log("Offline - using cached models data")
            return cached
        }
        throw new Error("No models data available. Check your internet connection.")

    }
}