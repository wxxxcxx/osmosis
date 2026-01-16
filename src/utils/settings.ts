import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export const STORAGE_KEY = "extension_settings"

/** 可用的词典提供者 */
export type DictionaryProviderType = "freedictionary" | "youdao"

export interface Settings {
    showComment: boolean
    highlightStyle: "wavy" | "solid" | "dotted" | "dashed" | "none"
    theme: "light" | "dark" | "auto"
    highlightColor: string
    commentBgColor: string
    commentTextColor: string
    /** 默认词典提供者 */
    dictionaryProvider: DictionaryProviderType
}

export const defaultSettings: Settings = {
    showComment: true,
    highlightStyle: "wavy",
    theme: "auto",
    highlightColor: "#3b82f6",
    commentBgColor: "#3b82f6",
    commentTextColor: "#ffffff",
    dictionaryProvider: "freedictionary"
}

export const storage = new Storage()

export const useSettings = () => {
    return useStorage<Settings>(STORAGE_KEY, defaultSettings)
}
