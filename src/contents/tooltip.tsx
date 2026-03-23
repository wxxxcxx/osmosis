import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import styleText from 'data-text:../globals.css';
import type { PlasmoCSUIJSXContainer, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React from "react";
import { createRoot } from "react-dom/client";
import Detail from "~components/detail";
import { useAnchorElement } from "~hooks/use-anchor-element";
import { useTooltipPosition } from "~hooks/use-tooltip-position";
import { useWordQuery } from "~hooks/use-word-query";
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
    const { anchorElement, anchorData, isSelection } = useAnchorElement()

    // 获取单词数据
    const { data, loading } = useWordQuery(anchorData?.wordKey)

    // 计算 tooltip 位置
    const {
        tooltipRef,
        positionStyles,
        arrowStyles,
        position
    } = useTooltipPosition(anchorElement, [anchorData?.wordKey, data, loading])

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
    const showTooltip = !!(settings && anchorData?.wordKey);
    const transformOriginClass = position === 'top' ? 'origin-bottom' : 'origin-top'
    const tooltipSurfaceStyle = React.useMemo<React.CSSProperties>(() => ({
        backgroundColor: isDarkTheme ? 'rgba(15, 23, 42, 0.94)' : '#ffffff',
        border: isDarkTheme ? '1px solid rgba(248, 250, 252, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: isDarkTheme
            ? '0 0 0 1px rgba(248, 250, 252, 0.03), 0 0 16px rgba(248, 250, 252, 0.14), 0 16px 32px rgba(148, 163, 184, 0.14)'
            : '0 0 0 1px rgba(15, 23, 42, 0.03), 0 16px 34px rgba(15, 23, 42, 0.16), 0 6px 16px rgba(15, 23, 42, 0.10)'
    }), [isDarkTheme])
    const [contentHeight, setContentHeight] = React.useState<number | null>(null)
    const [contentScrollable, setContentScrollable] = React.useState(false)
    const measureRef = React.useRef<HTMLDivElement>(null)

    const renderTooltipBody = (scrollable: boolean) => {
        if (loading) {
            return (
                <div className="w-full flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-border border-t-main rounded-full animate-spin"></div>
                </div>
            )
        }

        if (data?.code === 0) {
            return (
                <div className="w-full min-h-0 flex flex-col">
                    <Detail text={anchorData?.text || ''} data={data} scrollable={scrollable} />
                </div>
            )
        }

        return (
            <div className="w-full text-sm text-text-muted">
                {data?.message || t('noDefinitions')}
            </div>
        )
    }

    React.useLayoutEffect(() => {
        if (!showTooltip || !measureRef.current) {
            return
        }

        const maxTooltipHeight = 300

        const updateHeight = () => {
            if (!measureRef.current) {
                return
            }

            const nextHeight = Math.min(
                Math.ceil(measureRef.current.getBoundingClientRect().height),
                maxTooltipHeight
            )
            const nextScrollable = Math.ceil(measureRef.current.getBoundingClientRect().height) > maxTooltipHeight

            setContentHeight((prevHeight) =>
                prevHeight === nextHeight ? prevHeight : nextHeight
            )
            setContentScrollable((prevScrollable) =>
                prevScrollable === nextScrollable ? prevScrollable : nextScrollable
            )
        }

        updateHeight()

        const observer = new ResizeObserver(updateHeight)
        observer.observe(measureRef.current)

        return () => observer.disconnect()
    }, [showTooltip, anchorData?.wordKey, data, loading])

    React.useEffect(() => {
        if (!showTooltip) {
            setContentHeight(null)
            setContentScrollable(false)
        }
    }, [showTooltip])

    return (
        <div className={clsx("theme-root", { "dark": isDarkTheme })}>
            <style>{styleText}</style>

            {/* 顶层定位容器：负责 fixed 定位，不参与 motion 计算 */}
            <div
                style={{
                    ...positionStyles,
                    zIndex: 99999,
                    pointerEvents: 'none',
                }}
            >
                {showTooltip && (
                    <div
                        aria-hidden="true"
                        className="absolute left-0 top-0 invisible pointer-events-none"
                    >
                        <div
                            ref={measureRef}
                            style={tooltipSurfaceStyle}
                            className={clsx(
                                "p-4 rounded-lg w-[300px]",
                                "flex flex-col relative",
                                "text-text-primary"
                            )}
                        >
                            {renderTooltipBody(false)}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {showTooltip && (
                        <motion.div
                            key={anchorData.wordKey}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                duration: 0.4,
                                ease: [0.23, 1, 0.32, 1]
                            }}
                            className={clsx("pointer-events-auto", "relative", transformOriginClass)}
                            onMouseDown={preventDefault}
                            onMouseUp={stopPropagation}
                            onClick={stopPropagation}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <motion.div
                                ref={tooltipRef}
                                initial={false}
                                animate={contentHeight == null ? undefined : { height: contentHeight }}
                                style={tooltipSurfaceStyle}
                                transition={{
                                    height: {
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 25
                                    }
                                }}
                                className={clsx(
                                    "osmosis-tooltip-container ",
                                    "p-4 rounded-lg w-[300px] max-h-[300px] overflow-hidden",
                                    "flex flex-col relative",
                                    "text-text-primary"
                                )}
                            >
                                {renderTooltipBody(contentScrollable)}
                            </motion.div>

                            {/* 箭头：挂载到外层，避免高度裁剪时被截断 */}
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
