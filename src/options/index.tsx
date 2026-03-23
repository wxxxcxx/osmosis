import { clsx } from "clsx"
import React from "react"

import "../globals.css"

import {
    dictionaryProviderOptions,
    highlightStyleOptions,
    settingsGroupDefinitions,
    themeOptions,
    useSettings,
    vaultProviderOptions,
    type Settings,
    type SettingsFieldKey
} from "../utils/settings"
import { useTranslation } from "~utils/i18n"

const sectionCardClass =
    "flex items-center justify-between gap-6 p-5 bg-gray-100 dark:bg-[#444] rounded-2xl border border-black/5 dark:border-white/5"

const selectClass =
    "bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[220px]"

function Options() {
    const { t } = useTranslation(["options", "common"])
    const [settings, setSettings] = useSettings()

    React.useEffect(() => {
        if (!settings) return

        if (
            settings.basic.theme === "dark" ||
            (settings.basic.theme === "auto" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [settings?.basic.theme])

    if (!settings) {
        return <div>{t("common:loading")}</div>
    }

    const renderSelectCard = (
        key: SettingsFieldKey,
        label: string,
        description: string,
        value: string,
        onChange: (value: string) => void,
        options: Array<{ value: string; labelKey: string }>
    ) => (
        <div key={key} className={sectionCardClass}>
            <div>
                <h3 className="font-semibold text-lg">{label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={selectClass}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                    </option>
                ))}
            </select>
        </div>
    )

    const renderColorCard = (
        key: SettingsFieldKey,
        label: string,
        description: string,
        value: string,
        onChange: (value: string) => void
    ) => (
        <div key={key} className={sectionCardClass}>
            <div>
                <span className="font-semibold text-lg">{label}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <input
                type="color"
                className="h-10 w-16 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent p-1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )

    const renderField = (field: SettingsFieldKey) => {
        switch (field) {
            case "basic.theme":
                return renderSelectCard(
                    field,
                    t("theme.label"),
                    t("theme.description"),
                    settings.basic.theme,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            basic: {
                                ...prev.basic,
                                theme: value as Settings["basic"]["theme"]
                            }
                        })),
                    themeOptions
                )
            case "behavior.showComment":
                return (
                    <div key={field} className={sectionCardClass}>
                        <div>
                            <h3 className="font-semibold text-lg">{t("showComments.label")}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("showComments.description")}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.behavior.showComment}
                                onChange={() =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        behavior: {
                                            ...prev.behavior,
                                            showComment: !prev.behavior.showComment
                                        }
                                    }))
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                )
            case "appearance.highlightStyle":
                return renderSelectCard(
                    field,
                    t("highlightStyle.label"),
                    t("highlightStyle.description"),
                    settings.appearance.highlightStyle,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            appearance: {
                                ...prev.appearance,
                                highlightStyle: value as Settings["appearance"]["highlightStyle"]
                            }
                        })),
                    highlightStyleOptions
                )
            case "appearance.highlightColor":
                return renderColorCard(
                    field,
                    t("colors.highlight.label"),
                    t("colors.highlight.description"),
                    settings.appearance.highlightColor,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            appearance: {
                                ...prev.appearance,
                                highlightColor: value
                            }
                        }))
                )
            case "appearance.commentBgColor":
                return renderColorCard(
                    field,
                    t("colors.commentBg.label"),
                    t("colors.commentBg.description"),
                    settings.appearance.commentBgColor,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            appearance: {
                                ...prev.appearance,
                                commentBgColor: value
                            }
                        }))
                )
            case "appearance.commentTextColor":
                return renderColorCard(
                    field,
                    t("colors.commentText.label"),
                    t("colors.commentText.description"),
                    settings.appearance.commentTextColor,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            appearance: {
                                ...prev.appearance,
                                commentTextColor: value
                            }
                        }))
                )
            case "dictionary.provider":
                return renderSelectCard(
                    field,
                    t("dictionary.label"),
                    t("dictionary.description"),
                    settings.dictionary.provider,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            dictionary: {
                                ...prev.dictionary,
                                provider: value as Settings["dictionary"]["provider"]
                            }
                        })),
                    dictionaryProviderOptions
                )
            case "storage.provider":
                return renderSelectCard(
                    field,
                    t("vault.label"),
                    t("vault.description"),
                    settings.storage.provider,
                    (value) =>
                        setSettings((prev) => ({
                            ...prev,
                            storage: {
                                ...prev.storage,
                                provider: value as Settings["storage"]["provider"]
                            }
                        })),
                    vaultProviderOptions
                )
            default:
                return null
        }
    }

    return (
        <div className={clsx("p-8 max-w-3xl mx-auto font-sans text-[#333] dark:text-[#ccc]")}>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {t("pageDescription")}
            </p>

            <div className="space-y-8">
                {settingsGroupDefinitions.map((group) => (
                    <section key={group.key} className="space-y-4">
                        <div>
                            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                {t(`groups.${group.key}.title`)}
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {t(`groups.${group.key}.description`)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {group.fields.map((field) => renderField(field))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}

export default Options
