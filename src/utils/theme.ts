import { useEffect, useState } from "react"
import { useSettings } from "./settings"

/**
 * 自定义 Hook: 用于检测当前主题是否为深色模式。
 * 
 * 功能:
 * 1. 根据用户设置的 theme 值（"light"、"dark"、"auto"）判断主题
 * 2. 当设置为 "auto" 时，监听系统主题偏好变化
 * 3. 响应式更新，当设置或系统主题变化时自动更新
 * 
 * @returns isDark - 当前是否为深色模式
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDark = useTheme()
 *   return <div className={isDark ? 'dark' : ''}>...</div>
 * }
 * ```
 */
export const useTheme = () => {
    const [settings] = useSettings()
    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        if (!settings) return

        /**
         * 检查并更新深色模式状态
         * - "dark": 强制深色
         * - "light": 强制浅色
         * - "auto": 跟随系统
         */
        const checkDark = () => {
            if (
                settings.theme === "dark" ||
                (settings.theme === "auto" &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches)
            ) {
                setIsDark(true)
            } else {
                setIsDark(false)
            }
        }

        // 初始检查
        checkDark()

        // 监听系统主题变化（仅在 auto 模式下有意义）
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        mediaQuery.addEventListener("change", checkDark)

        return () => mediaQuery.removeEventListener("change", checkDark)
    }, [settings?.theme])

    return isDark
}
