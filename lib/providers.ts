import { readConfigFile, writeConfigFile } from "./config";


export interface ProviderConfig {
    api_key: string;
}

export type ProvidersStore = Record<string, ProviderConfig>

export function getProviders(): ProvidersStore {
    return readConfigFile<ProvidersStore>("providers.json") ?? {}
}

export function getProvider(name: string): ProviderConfig | null {
    return getProviders()[name] ?? null
}

export function saveProvider(name: string, config: ProviderConfig): void {
    const store = getProviders()
    store[name] = config
    writeConfigFile("providers.json", store, true)
}

export function removeProvider(name: string): boolean {
    const store = getProviders()
    if (!store[name]) return false
    delete store[name]
    writeConfigFile("providers.json", store, true)
    return true
}