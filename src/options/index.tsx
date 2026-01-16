import { clsx } from "clsx"
import React from "react"

import "../globals.css"

import { useSettings, type DictionaryProviderType } from "../utils/settings"

function Options() {
    const [settings, setSettings] = useSettings()

    if (!settings) {
        return <div>Loading...</div>
    }

    React.useEffect(() => {
        if (settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [settings.theme])

    const handleToggleTranslation = () => {
        setSettings((prev) => ({ ...prev, showTranslation: !prev.showTranslation }))
    }

    const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings((prev) => ({ ...prev, highlightStyle: e.target.value as any }))
    }

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings((prev) => ({ ...prev, theme: e.target.value as any }))
    }

    const handleDictionaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings((prev) => ({ ...prev, dictionaryProvider: e.target.value as DictionaryProviderType }))
    }

    return (
        <div className={clsx("p-8 max-w-2xl mx-auto font-sans text-[#333] dark:text-[#ccc]")}>
            <h1 className="text-2xl font-bold mb-6">Osmosis Settings</h1>

            <div className="space-y-6">
                {/* Translation Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">Show Translations</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Display the first definition next to the highlighted word.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.showTranslation}
                            onChange={handleToggleTranslation}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Dictionary Provider Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">Dictionary</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose the dictionary API for word definitions.
                        </p>
                    </div>
                    <select
                        value={settings.dictionaryProvider}
                        onChange={handleDictionaryChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[180px]"
                    >
                        <option value="freedictionary">Free Dictionary</option>
                        <option value="youdao">有道词典</option>
                    </select>
                </div>

                {/* Highlight Style Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">Highlight Style</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose how the starred words are underlined.
                        </p>
                    </div>
                    <select
                        value={settings.highlightStyle}
                        onChange={handleStyleChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[150px]"
                    >
                        <option value="wavy">Wavy</option>
                        <option value="solid">Solid</option>
                        <option value="dotted">Dotted</option>
                        <option value="dashed">Dashed</option>
                        <option value="none">None</option>
                    </select>
                </div>

                {/* Theme Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">Theme</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select the extension theme.
                        </p>
                    </div>
                    <select
                        value={settings.theme}
                        onChange={handleThemeChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[150px]"
                    >
                        <option value="auto">Auto</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>

                {/* Colors Configuration */}
                <div className="flex flex-col gap-4 p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <h3 className="font-semibold text-lg">Colors</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm">Highlight Color</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Color of the underline</p>
                        </div>
                        <input
                            type="color"
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                            value={settings.highlightColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, highlightColor: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm">Translation Background</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Background of the translation pill</p>
                        </div>
                        <input
                            type="color"
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                            value={settings.translationBgColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, translationBgColor: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm">Translation Text</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Foreground color of text</p>
                        </div>
                        <input
                            type="color"
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                            value={settings.translationTextColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, translationTextColor: e.target.value }))}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Options

