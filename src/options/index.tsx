import { clsx } from "clsx"
import React from "react"

import "../globals.css"

import { useSettings, type DictionaryProviderType } from "../utils/settings"
import { useTranslation } from "~utils/i18n"

function Options() {
    const { t } = useTranslation(['options', 'common'])
    const [settings, setSettings] = useSettings()

    if (!settings) {
        return <div>{t('common:loading')}</div>
    }

    React.useEffect(() => {
        if (settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }, [settings.theme])

    const handleToggleComment = () => {
        setSettings((prev) => ({ ...prev, showComment: !prev.showComment }))
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
            <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

            <div className="space-y-6">
                {/* Comment Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">{t('showComments.label')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('showComments.description')}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.showComment}
                            onChange={handleToggleComment}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Dictionary Provider Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">{t('dictionary.label')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('dictionary.description')}
                        </p>
                    </div>
                    <select
                        value={settings.dictionaryProvider}
                        onChange={handleDictionaryChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[180px]"
                    >
                        <option value="freedictionary">{t('dictionary.freeDictionary')}</option>
                        <option value="youdao">{t('dictionary.youdao')}</option>
                    </select>
                </div>

                {/* Highlight Style Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">{t('highlightStyle.label')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('highlightStyle.description')}
                        </p>
                    </div>
                    <select
                        value={settings.highlightStyle}
                        onChange={handleStyleChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[150px]"
                    >
                        <option value="wavy">{t('highlightStyle.wavy')}</option>
                        <option value="solid">{t('highlightStyle.solid')}</option>
                        <option value="dotted">{t('highlightStyle.dotted')}</option>
                        <option value="dashed">{t('highlightStyle.dashed')}</option>
                        <option value="none">{t('highlightStyle.none')}</option>
                    </select>
                </div>

                {/* Theme Select */}
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <div>
                        <h3 className="font-semibold text-lg">{t('theme.label')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('theme.description')}
                        </p>
                    </div>
                    <select
                        value={settings.theme}
                        onChange={handleThemeChange}
                        className="bg-white dark:bg-[#555] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[150px]"
                    >
                        <option value="auto">{t('theme.auto')}</option>
                        <option value="light">{t('theme.light')}</option>
                        <option value="dark">{t('theme.dark')}</option>
                    </select>
                </div>

                {/* Colors Configuration */}
                <div className="flex flex-col gap-4 p-4 bg-gray-100 dark:bg-[#444] rounded-lg">
                    <h3 className="font-semibold text-lg">{t('colors.title')}</h3>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm">{t('colors.highlight.label')}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('colors.highlight.description')}</p>
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
                            <span className="font-medium text-sm">{t('colors.commentBg.label')}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('colors.commentBg.description')}</p>
                        </div>
                        <input
                            type="color"
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                            value={settings.commentBgColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, commentBgColor: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-medium text-sm">{t('colors.commentText.label')}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('colors.commentText.description')}</p>
                        </div>
                        <input
                            type="color"
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
                            value={settings.commentTextColor}
                            onChange={(e) => setSettings((prev) => ({ ...prev, commentTextColor: e.target.value }))}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Options
