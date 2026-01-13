import type { PlasmoCSUIProps } from "plasmo";
import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS } from "~utils/constants";
import styleText from 'data-text:../globals.css'
import { useSettings } from "~utils/settings";
import { sendToBackground } from "@plasmohq/messaging";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from "react";
import { clsx } from "clsx";
import WordCard from "~components/description";
import { useTheme } from "~utils/theme";
import { AnimatePresence, motion } from "motion/react";

// 计算tooltip的最佳位置
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

function calculatePosition(anchorRect: DOMRect, tooltipWidth: number, tooltipHeight: number): {
    position: TooltipPosition,
    offset: { x: number, y: number }
} {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const margin = 10

    const spaceTop = anchorRect.top
    const spaceBottom = viewportHeight - anchorRect.bottom
    const spaceLeft = anchorRect.left
    const spaceRight = viewportWidth - anchorRect.right

    const requiredHeight = tooltipHeight + margin
    const requiredWidth = tooltipWidth + margin

    // 优先选择下方，其次上方，再次右侧，最后左侧
    let position: TooltipPosition = 'bottom'

    if (spaceBottom >= requiredHeight) {
        position = 'bottom'
    } else if (spaceTop >= requiredHeight) {
        position = 'top'
    } else if (spaceRight >= requiredWidth) {
        position = 'right'
    } else if (spaceLeft >= requiredWidth) {
        position = 'left'
    } else {
        // 空间都不够，选择空间最大的方向
        const maxSpace = Math.max(spaceBottom, spaceTop, spaceRight, spaceLeft)
        if (maxSpace === spaceBottom) position = 'bottom'
        else if (maxSpace === spaceTop) position = 'top'
        else if (maxSpace === spaceRight) position = 'right'
        else position = 'left'
    }

    // 计算偏移量，确保tooltip不超出视口
    let offsetX = 0
    let offsetY = 0

    if (position === 'top' || position === 'bottom') {
        // 水平居中对齐anchor
        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const tooltipLeft = anchorCenterX - tooltipWidth / 2
        const tooltipRight = anchorCenterX + tooltipWidth / 2

        if (tooltipLeft < margin) {
            offsetX = margin - tooltipLeft
        } else if (tooltipRight > viewportWidth - margin) {
            offsetX = (viewportWidth - margin) - tooltipRight
        }
    } else {
        // 垂直居中对齐anchor
        const anchorCenterY = anchorRect.top + anchorRect.height / 2
        const tooltipTop = anchorCenterY - tooltipHeight / 2
        const tooltipBottom = anchorCenterY + tooltipHeight / 2

        if (tooltipTop < margin) {
            offsetY = margin - tooltipTop
        } else if (tooltipBottom > viewportHeight - margin) {
            offsetY = (viewportHeight - margin) - tooltipBottom
        }
    }

    return { position, offset: { x: offsetX, y: offsetY } }
}

// Overlay组件通过PlasmoCSUIProps接收anchor
const TooltipOverlay: FC<PlasmoCSUIProps> = ({ anchor }) => {
    const isDarkTheme = useTheme()
    const [settings] = useSettings()
    const [wordData, setWordData] = useState<{
        code: number
        definitions: string[]
        starred: boolean
        message: string | null
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [position, setPosition] = useState<TooltipPosition>('bottom')
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const tooltipRef = useRef<HTMLDivElement>(null)

    // 动态获取当前的 anchor 元素
    const anchorElement = useMemo<HTMLElement | null>(() => {
        // 优先使用 selection
        const selection = document.querySelector('osmosis-selection') as HTMLElement
        if (selection) return selection
        // 其次使用带有 TOOLTIP_SHOW_CLASS 的 starred 单词
        const starredWord = document.querySelector(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`) as HTMLElement
        if (starredWord) return starredWord
        // 最后回退到 Plasmo 提供的 anchor
        return anchor.element as HTMLElement
    }, [anchor.element])

    // 判断anchor是否为选区元素
    const isSelection = anchorElement?.tagName?.toLowerCase() === 'osmosis-selection'

    // 从anchor元素获取data-key和data-text
    const dataKey = anchorElement?.dataset?.key || ''
    const dataText = anchorElement?.dataset?.text || ''

    // 获取单词数据
    useEffect(() => {
        if (!dataKey) return

        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await sendToBackground({
                    name: 'query',
                    body: { key: dataKey }
                })
                setWordData(response)
            } catch (error) {
                console.error("Osmosis: Failed to fetch word data", error)
                setWordData({
                    code: -1,
                    definitions: [],
                    starred: false,
                    message: "Failed to fetch word data"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [dataKey])

    // 计算位置
    useLayoutEffect(() => {
        if (!tooltipRef.current || !anchorElement) return

        const anchorRect = anchorElement.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()

        const { position: newPosition, offset: newOffset } = calculatePosition(
            anchorRect,
            tooltipRect.width,
            tooltipRect.height
        )

        setPosition(newPosition)
        setOffset(newOffset)
    }, [anchorElement, wordData, loading])

    if (!settings || !dataKey) return null

    // 位置样式 - 外层容器已定位在 anchor 的 left/top，只需计算相对偏移
    const getPositionStyles = (): React.CSSProperties | undefined => {
        if (!anchorElement || !tooltipRef.current) return undefined

        const anchorRect = anchorElement.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const tooltipWidth = tooltipRect.width || 300 // 默认宽度
        const tooltipHeight = tooltipRect.height || 100 // 默认高度
        const anchorWidth = anchorRect.width
        const anchorHeight = anchorRect.height

        const baseStyles: React.CSSProperties = {
            position: 'absolute',
            zIndex: 2147483647,
        }

        const gap = 8 // tooltip 与 anchor 之间的间距

        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    // tooltip 底部在 anchor 顶部上方 gap 距离处
                    bottom: `${anchorHeight + gap}px`,
                    // tooltip 水平居中对齐 anchor 中心
                    left: `${(anchorWidth - tooltipWidth) / 2 + offset.x}px`,
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    // tooltip 顶部在 anchor 底部下方 gap 距离处
                    top: `${anchorHeight + gap}px`,
                    // tooltip 水平居中对齐 anchor 中心
                    left: `${(anchorWidth - tooltipWidth) / 2 + offset.x}px`,
                }
            case 'left':
                return {
                    ...baseStyles,
                    // tooltip 右侧在 anchor 左侧左方 gap 距离处
                    right: `${anchorWidth + gap}px`,
                    // tooltip 垂直居中对齐 anchor 中心
                    top: `${(anchorHeight - tooltipHeight) / 2 + offset.y}px`,
                }
            case 'right':
                return {
                    ...baseStyles,
                    // tooltip 左侧在 anchor 右侧右方 gap 距离处
                    left: `${anchorWidth + gap}px`,
                    // tooltip 垂直居中对齐 anchor 中心
                    top: `${(anchorHeight - tooltipHeight) / 2 + offset.y}px`,
                }
            default:
                return baseStyles
        }
    }

    // 箭头样式
    const getArrowStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: 'absolute',
            width: 0,
            height: 0,
        }

        // 箭头指向 anchor 中心
        // offset 用于边界修正，箭头需要反向偏移来补偿
        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    bottom: '-6px',
                    left: '50%',
                    transform: `translateX(calc(-50% - ${offset.x}px))`,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--color-bg-surface)',
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: '-6px',
                    left: '50%',
                    transform: `translateX(calc(-50% - ${offset.x}px))`,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid var(--color-bg-surface)',
                }
            case 'left':
                return {
                    ...baseStyles,
                    right: '-6px',
                    top: '50%',
                    transform: `translateY(calc(-50% - ${offset.y}px))`,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '6px solid var(--color-bg-surface)',
                }
            case 'right':
                return {
                    ...baseStyles,
                    left: '-6px',
                    top: '50%',
                    transform: `translateY(calc(-50% - ${offset.y}px))`,
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '6px solid var(--color-bg-surface)',
                }
            default:
                return baseStyles
        }
    }

    // 动画变体
    const variants = {
        top: {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 8 }
        },
        bottom: {
            initial: { opacity: 0, y: -8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -8 }
        },
        left: {
            initial: { opacity: 0, x: 8 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 8 }
        },
        right: {
            initial: { opacity: 0, x: -8 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -8 }
        }
    }

    const anchorRect = anchorElement?.getBoundingClientRect()

    return (
        <div className={clsx("theme-root", { "dark": isDarkTheme })} style={{ position: 'relative' }}>
            <style>{styleText}</style>
            <AnimatePresence>
                <motion.div
                    ref={tooltipRef}
                    className={clsx(
                        "osmosis-tooltip-container",
                        "p-4 rounded-lg shadow-lg w-[300px]",
                        "bg-surface text-text-primary",
                        "pointer-events-auto"
                    )}
                    style={getPositionStyles()}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={variants[position]}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                        // 只对已star单词(非选区)处理鼠标移入事件
                        if (!isSelection) {
                            // 清除单词元素上的隐藏timeout
                            const starredWord = document.querySelector(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`) as HTMLElement
                            if (starredWord?.dataset.hideTimeoutId) {
                                clearTimeout(Number(starredWord.dataset.hideTimeoutId))
                                delete starredWord.dataset.hideTimeoutId
                            }
                        }
                    }}
                    onMouseLeave={() => {
                        // 只对已star单词(非选区)的tooltip处理鼠标移出事件
                        if (!isSelection) {
                            // 移除单词的TOOLTIP_SHOW_CLASS，触发tooltip隐藏
                            const starredWord = document.querySelector(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`)
                            if (starredWord) {
                                starredWord.classList.remove(TOOLTIP_SHOW_CLASS)
                            }
                        }
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-border border-t-main rounded-full animate-spin"></div>
                        </div>
                    ) : wordData?.code === 0 ? (
                        <WordCard text={dataText} data={wordData} />
                    ) : (
                        <div className="text-sm text-text-muted">
                            {wordData?.message || "未找到释义"}
                        </div>
                    )}
                    {/* 箭头 */}
                    <div style={getArrowStyles()}></div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default TooltipOverlay
