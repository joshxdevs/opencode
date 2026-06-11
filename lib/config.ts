import { homedir } from "os"
import { join } from "path"
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"

export const CONFIG_DIR = join(homedir(), ".opencode")

if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
}

export function readConfigFile<T>(filename: string): T | null {
    const filePath = join(CONFIG_DIR, filename)
    if (!existsSync(filePath)) return null
    try {
        return JSON.parse(readFileSync(filePath, "utf-8")) as T
    } catch {
        return null
    }
}

export function writeConfigFile(filename: string, data: unknown, secure = false): void {
    const filePath = join(CONFIG_DIR, filename)
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    if (secure) {
        chmodSync(filePath, 0o600)
    }
}

export interface AppConfig {
    active_model?: string
}

export function getConfig(): AppConfig {
    return readConfigFile<AppConfig>("config.json") ?? {}
}

export function saveConfig(config: AppConfig): void {
    return writeConfigFile("config.json", config)
}