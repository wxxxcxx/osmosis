import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export const STORAGE_KEY = "extension_settings"

/** 可用的词典提供者 */
export type DictionaryProviderType = "freedictionary" | "youdao"

/** 可用的 Vault 提供者 */
export type VaultProviderType = "sync" | "local"

export interface Settings {
    showComment: boolean
    highlightStyle: "wavy" | "solid" | "dotted" | "dashed" | "none"
    theme: "light" | "dark" | "auto"
    highlightColor: string
    commentBgColor: string
    commentTextColor: string
    /** 默认词典提供者 */
    dictionaryProvider: DictionaryProviderType
    /** 单词本存储提供者 */
    vaultProvider: VaultProviderType
}

export const defaultSettings: Settings = {
    showComment: true,
    highlightStyle: "wavy",
    theme: "auto",
    highlightColor: "#3b82f6",
    commentBgColor: "#3b82f6",
    commentTextColor: "#ffffff",
    dictionaryProvider: "freedictionary",
    vaultProvider: "sync"
}

export const storage = new Storage()

export const useSettings = () => {
    return useStorage<Settings>(STORAGE_KEY, defaultSettings)
}