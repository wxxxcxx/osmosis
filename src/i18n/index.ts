import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// 导入各模块翻译资源
import enCommon from './locales/en/common.json'
import enPopup from './locales/en/popup.json'
import enOptions from './locales/en/options.json'
import enDetail from './locales/en/detail.json'

import zhCommon from './locales/zh/common.json'
import zhPopup from './locales/zh/popup.json'
import zhOptions from './locales/zh/options.json'
import zhDetail from './locales/zh/detail.json'

// 定义资源
const resources = {
    en: {
        common: enCommon,
        popup: enPopup,
        options: enOptions,
        detail: enDetail
    },
    zh: {
        common: zhCommon,
        popup: zhPopup,
        options: zhOptions,
        detail: zhDetail
    }
}

// 获取浏览器语言
const getBrowserLanguage = (): string => {
    const lang = chrome.i18n.getUILanguage()
    // 将 zh-CN, zh-TW 等统一为 zh
    if (lang.startsWith('zh')) return 'zh'
    // 将 en-US, en-GB 等统一为 en
    if (lang.startsWith('en')) return 'en'
    // 默认英文
    return 'en'
}

// 初始化 i18next
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getBrowserLanguage(),
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: ['common', 'popup', 'options', 'detail'],
        interpolation: {
            escapeValue: false // React 已经默认转义
        },
        react: {
            useSuspense: false // 关闭 Suspense 以兼容浏览器扩展环境
        }
    })

export default i18n
