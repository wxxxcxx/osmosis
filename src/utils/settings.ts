import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import { useCallback, useEffect, useMemo } from "react"
import { z } from "zod"

export const STORAGE_KEY = "extension_settings"

export const dictionaryProviderSchema = z.enum(["freedictionary", "youdao"])
export type DictionaryProviderType = z.infer<typeof dictionaryProviderSchema>

export const vaultProviderSchema = z.enum(["sync", "local"])
export type VaultProviderType = z.infer<typeof vaultProviderSchema>

export const themeSchema = z.enum(["light", "dark", "auto"])
export const highlightStyleSchema = z.enum(["wavy", "solid", "dotted", "dashed", "none"])

export const settingsSchema = z.object({
    basic: z.object({
        theme: themeSchema
    }),
    appearance: z.object({
        highlightStyle: highlightStyleSchema,
        highlightColor: z.string(),
        commentBgColor: z.string(),
        commentTextColor: z.string()
    }),
    behavior: z.object({
        showComment: z.boolean()
    }),
    dictionary: z.object({
        provider: dictionaryProviderSchema
    }),
    storage: z.object({
        provider: vaultProviderSchema
    })
})

export type Settings = z.infer<typeof settingsSchema>

const partialSettingsSchema = z.object({
    basic: z.object({
        theme: themeSchema.optional()
    }).optional(),
    appearance: z.object({
        highlightStyle: highlightStyleSchema.optional(),
        highlightColor: z.string().optional(),
        commentBgColor: z.string().optional(),
        commentTextColor: z.string().optional()
    }).optional(),
    behavior: z.object({
        showComment: z.boolean().optional()
    }).optional(),
    dictionary: z.object({
        provider: dictionaryProviderSchema.optional()
    }).optional(),
    storage: z.object({
        provider: vaultProviderSchema.optional()
    }).optional()
}).passthrough()

type PartialSettings = z.infer<typeof partialSettingsSchema>

export const defaultSettings: Settings = settingsSchema.parse({
    basic: {
        theme: "auto"
    },
    appearance: {
        highlightStyle: "wavy",
        highlightColor: "#3b82f6",
        commentBgColor: "#3b82f6",
        commentTextColor: "#ffffff"
    },
    behavior: {
        showComment: true
    },
    dictionary: {
        provider: "freedictionary"
    },
    storage: {
        provider: "sync"
    }
})

export type SettingsFieldKey =
    | "basic.theme"
    | "appearance.highlightStyle"
    | "appearance.highlightColor"
    | "appearance.commentBgColor"
    | "appearance.commentTextColor"
    | "behavior.showComment"
    | "dictionary.provider"
    | "storage.provider"

export type SettingsGroupKey = "basic" | "appearance" | "behavior" | "dictionary" | "storage"

export interface SettingsOption<T extends string> {
    value: T
    labelKey: string
}

export const themeOptions: SettingsOption<Settings["basic"]["theme"]>[] = [
    { value: "auto", labelKey: "theme.auto" },
    { value: "light", labelKey: "theme.light" },
    { value: "dark", labelKey: "theme.dark" }
]

export const highlightStyleOptions: SettingsOption<Settings["appearance"]["highlightStyle"]>[] = [
    { value: "wavy", labelKey: "highlightStyle.wavy" },
    { value: "solid", labelKey: "highlightStyle.solid" },
    { value: "dotted", labelKey: "highlightStyle.dotted" },
    { value: "dashed", labelKey: "highlightStyle.dashed" },
    { value: "none", labelKey: "highlightStyle.none" }
]

export const dictionaryProviderOptions: SettingsOption<DictionaryProviderType>[] = [
    { value: "freedictionary", labelKey: "dictionary.freeDictionary" },
    { value: "youdao", labelKey: "dictionary.youdao" }
]

export const vaultProviderOptions: SettingsOption<VaultProviderType>[] = [
    { value: "sync", labelKey: "vault.sync" },
    { value: "local", labelKey: "vault.local" }
]

export const settingsGroupDefinitions: Array<{
    key: SettingsGroupKey
    fields: SettingsFieldKey[]
}> = [
    {
        key: "basic",
        fields: ["basic.theme"]
    },
    {
        key: "appearance",
        fields: [
            "appearance.highlightStyle",
            "appearance.highlightColor",
            "appearance.commentBgColor",
            "appearance.commentTextColor"
        ]
    },
    {
        key: "behavior",
        fields: ["behavior.showComment"]
    },
    {
        key: "dictionary",
        fields: ["dictionary.provider"]
    },
    {
        key: "storage",
        fields: ["storage.provider"]
    }
]

export const popupSettingsFields: SettingsFieldKey[] = [
    "basic.theme",
    "dictionary.provider",
    "storage.provider"
]

export const storage = new Storage()

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const mergeSettings = (base: Settings, patch?: PartialSettings): Settings => {
    return settingsSchema.parse({
        basic: { ...base.basic, ...patch?.basic },
        appearance: { ...base.appearance, ...patch?.appearance },
        behavior: { ...base.behavior, ...patch?.behavior },
        dictionary: { ...base.dictionary, ...patch?.dictionary },
        storage: { ...base.storage, ...patch?.storage }
    })
}

export const normalizeSettings = (value: unknown): Settings => {
    const parsed = settingsSchema.safeParse(value)
    if (parsed.success) {
        return parsed.data
    }

    if (isRecord(value)) {
        const hasNestedSettingsGroup =
            "basic" in value ||
            "appearance" in value ||
            "behavior" in value ||
            "dictionary" in value ||
            "storage" in value

        if (hasNestedSettingsGroup) {
            const partial = partialSettingsSchema.safeParse(value)
            if (partial.success) {
                return mergeSettings(defaultSettings, partial.data)
            }
        }
    }

    return defaultSettings
}

const isSameSettings = (left: unknown, right: Settings) => JSON.stringify(left) === JSON.stringify(right)

export const readSettings = async (settingsStorage: Storage = storage): Promise<Settings> => {
    const rawSettings = await settingsStorage.getItem(STORAGE_KEY)
    return normalizeSettings(rawSettings)
}

type SetSettingsAction = Settings | ((prev: Settings) => Settings)

export const useSettings = () => {
    const [rawSettings, setRawSettings] = useStorage<unknown>(STORAGE_KEY, defaultSettings)

    const settings = useMemo(() => normalizeSettings(rawSettings), [rawSettings])

    useEffect(() => {
        if (!isSameSettings(rawSettings, settings)) {
            void setRawSettings(settings)
        }
    }, [rawSettings, settings, setRawSettings])

    const setSettings = useCallback((action: SetSettingsAction) => {
        setRawSettings((previousRawSettings) => {
            const previousSettings = normalizeSettings(previousRawSettings)
            const nextSettings = typeof action === "function"
                ? action(previousSettings)
                : action

            return normalizeSettings(nextSettings)
        })
    }, [setRawSettings])

    return [settings, setSettings] as const
}
