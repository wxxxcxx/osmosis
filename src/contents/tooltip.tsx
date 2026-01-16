import { clsx } from "clsx";
import styleText from 'data-text:../globals.css';
import { AnimatePresence, motion } from "motion/react";
import type { PlasmoCSUIJSXContainer, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React from "react";
import { createRoot } from "react-dom/client";
import Detail from "~components/detail";
import {
    tooltipAnimationVariants,
    useAnchorElement,
    useTooltipPosition,
    useWordData
} from "~hooks";
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
        position,
        getPositionStyles,
        getArrowStyles
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
            <AnimatePresence mode="wait">
                {showTooltip && (
                    <motion.div
                        key={data.wordKey}
                        ref={tooltipRef}
                        variants={tooltipAnimationVariants[position]}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        layout
                        style={{
                            ...getPositionStyles(),
                            originY: position === 'top' ? 1 : 0,
                        }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 350,
                            mass: 0.5,
                            layout: { duration: 0.2 }
                        }}
                        className={clsx(
                            "osmosis-tooltip-container",
                            "p-4 rounded-lg shadow-lg w-[300px] max-h-[300px]",
                            "flex flex-col",
                            "bg-surface text-text-primary",
                            "pointer-events-auto",
                            "backdrop-blur-md bg-surface/90" // 增强质感
                        )}

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
                                {wordData?.message || t('noDefinitions')}
                            </div>
                        )}

                        {/* 箭头 */}
                        <div style={getArrowStyles()}></div>
                    </motion.div>
                )}
            </AnimatePresence>
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