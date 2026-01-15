import { clsx } from "clsx";
import styleText from 'data-text:../globals.css';
import type { PlasmoGetOverlayAnchor } from "plasmo";
import React, { useEffect, useState } from "react";
import Detail from "~components/detail";
import {
    useAnchorElement,
    useTooltipPosition,
    useWordData
} from "~hooks";
import { TOOLTIP_SHOW_CLASS } from "~utils/constants";
import { useSettings } from "~utils/settings";
import { useTheme } from "~utils/theme";

/**
 * Tooltip 覆盖层组件
 * 
 * 用于在 starred 单词或选区上显示单词释义的 tooltip
 */
export default function TooltipOverlay() {
    // 主题和设置
    const isDarkTheme = useTheme()
    const [settings] = useSettings()

    // 获取 anchor 元素和相关数据
    const { anchorElement, data, rect, isSelection } = useAnchorElement()

    // 获取单词数据
    const { wordData, loading } = useWordData(data?.wordKey)

    // 计算 tooltip 位置
    const {
        tooltipRef,
        position,
        getPositionStyles,
        getArrowStyles
    } = useTooltipPosition(rect, [wordData, loading])



    // 鼠标移入 tooltip 时保持显示状态
    const handleMouseEnter = () => {
        if (!isSelection && anchorElement) {
            anchorElement.classList.add(TOOLTIP_SHOW_CLASS)
        }
    }

    // 鼠标移出 tooltip 时隐藏
    const handleMouseLeave = () => {
        if (!isSelection && anchorElement) {
            anchorElement.classList.remove(TOOLTIP_SHOW_CLASS)
        }
    }

    // 阻止事件冒泡
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()
    const preventDefault = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
    }

    // 动画状态：挂载后触发
    const [isVisible, setIsVisible] = useState(false)
    useEffect(() => {
        setIsVisible(false) // 重置状态
        const timer = requestAnimationFrame(() => setIsVisible(true))
        return () => cancelAnimationFrame(timer)
    }, [data?.wordKey]) // 当单词变化时重置动画

    // 不满足显示条件时返回 null
    if (!settings || !data?.wordKey) return null

    return (
        <div className={clsx("theme-root", { "dark": isDarkTheme })}>
            <style>{styleText}</style>
            <div
                ref={tooltipRef}
                className={clsx(
                    "osmosis-tooltip-container",
                    "p-4 rounded-lg shadow-lg w-[300px]",
                    "bg-surface text-text-primary",
                    "pointer-events-auto",
                    "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", // 弹性曲线
                    isVisible
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-2"
                )}
                style={getPositionStyles()}
                onMouseDown={preventDefault}
                onMouseUp={stopPropagation}
                onClick={stopPropagation}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* 内容区域 */}
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-border border-t-main rounded-full animate-spin"></div>
                    </div>
                ) : wordData?.code === 0 ? (
                    <Detail text={data?.text || ''} data={wordData} />
                ) : (
                    <div className="text-sm text-text-muted">
                        {wordData?.message || "未找到释义"}
                    </div>
                )}

                {/* 箭头 */}
                <div style={getArrowStyles()}></div>
            </div>
        </div>
    )
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
    return document.body
}

