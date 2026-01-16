/**
 * 国际化（i18n）统一导出
 * 
 * 使用 react-i18next 进行 UI 翻译
 * Chrome 原生 i18n 仅用于 Manifest 翻译
 */

// 导入 i18next 配置（确保初始化）
import '../i18n'

// 从 react-i18next 导出常用方法
export { useTranslation, Trans, withTranslation } from 'react-i18next'
export { default as i18n } from 'i18next'

/**
 * 获取 Chrome 原生 i18n 消息（仅用于 Manifest 相关翻译）
 * @deprecated 优先使用 useTranslation hook
 */
export function chromeI18n(key: string, substitutions?: string | string[]): string {
    return chrome.i18n.getMessage(key, substitutions) || key
}

/**
 * 获取当前浏览器的语言环境
 */
export function getUILanguage(): string {
    return chrome.i18n.getUILanguage()
}

/**
 * 检查当前语言是否为中文
 */
export function isChineseLocale(): boolean {
    const lang = getUILanguage()
    return lang.startsWith('zh')
}
