import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import styleText from 'data-text:../globals.css';
import type { PlasmoCSUIJSXContainer, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React from "react";
import { createRoot } from "react-dom/client";
import Detail from "~components/detail";
import { useAnchorElement } from "~hooks/use-anchor-element";
import { useTooltipPosition } from "~hooks/use-tooltip-position";
import { useWordData } from "~hooks/use-word-data";
import { OSMOSIS_TOOLTIP_CONTAINER_ROOT_TAG, TOOLTIP_SHOW_CLASS } from "~utils/constants";
import { useTranslation } from "~utils/i18n";
import { useSettings } from "~utils/settings";
import { useTheme } from "~utils/theme";

/**
 * Tooltip 覆盖层组件
 * 
 * 用于在 starred 单词或选区上显示单词释义的 tooltip
 */
const TooltipOverlay = () => {
    const { t } = useTranslation('common')
    // 主题和设置
    const isDarkTheme = useTheme()
    const [settings] = useSettings()

    // 获取 anchor 元素和相关数据
    const { anchorElement, data, isSelection } = useAnchorElement()

    // 获取单词数据
    const { wordData, loading } = useWordData(data?.wordKey)

    // 计算 tooltip 位置
    const {
        tooltipRef,
        positionStyles,
        arrowStyles
    } = useTooltipPosition(anchorElement, [data?.wordKey, wordData, loading])

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

    // 不满足显示条件时返回 null
    const showTooltip = !!(settings && data?.wordKey);

    return (
        <div className={clsx("theme-root", { "dark": isDarkTheme })}>
            <style>{styleText}</style>

            {/* 顶层定位容器：负责 fixed 定位，不参与 motion 计算 */}
            <div
                style={{
                    ...positionStyles,
                    zIndex: 99999,
                    pointerEvents: 'none'
                }}
            >
                <AnimatePresence mode="popLayout">
                    {showTooltip && (
                        <motion.div
                            key={data.wordKey}
                            ref={tooltipRef}
                            layout={'size'}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.4,
                                ease: [0.23, 1, 0.32, 1],
                                layout: {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25
                                }
                            }}
                            className={clsx(
                                "osmosis-tooltip-container",
                                "p-4 rounded-lg shadow-lg w-[300px] max-h-[300px]",
                                "flex flex-col relative",
                                "bg-surface text-text-primary",
                                "pointer-events-auto",
                                "backdrop-blur-md bg-surface/90"
                            )}

                            onMouseDown={preventDefault}
                            onMouseUp={stopPropagation}
                            onClick={stopPropagation}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >

                            {loading ? (
                                <div
                                    key="loading"
                                    className="w-full flex items-center justify-center py-4"
                                >
                                    <div className="w-6 h-6 border-2 border-border border-t-main rounded-full animate-spin"></div>
                                </div>
                            ) : wordData?.code === 0 ? (
                                <div
                                    key="detail"

                                    className="w-full min-h-0 flex flex-col"
                                >
                                    <Detail text={data?.text || ''} data={wordData} />
                                </div>
                            ) : (
                                <div
                                    key="error"
                                    className="w-full text-sm text-text-muted"
                                >
                                    {wordData?.message || t('noDefinitions')}
                                </div>
                            )}


                            {/* 箭头：使用 absolute 挂载在 motion.div 内部 */}
                            <div style={arrowStyles}></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
    return document.body
}

export const getRootContainer = async () => {
    let rootContainer = document.querySelector(OSMOSIS_TOOLTIP_CONTAINER_ROOT_TAG) as HTMLElement
    if (!rootContainer) {
        rootContainer = document.createElement(OSMOSIS_TOOLTIP_CONTAINER_ROOT_TAG) as HTMLElement
        document.body.appendChild(rootContainer)
    }
    return rootContainer
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
    createRootContainer
}) => {
    const rootContainer = await createRootContainer()
    const container = (rootContainer instanceof NodeList ? rootContainer[0] : rootContainer) as HTMLElement

    if (!container || container.shadowRoot) {
        return
    }

    const shadow = container.attachShadow({ mode: 'open' })
    const root = createRoot(shadow)
    root.render(<TooltipOverlay />)
}

export default TooltipOverlay