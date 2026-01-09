import type { PlasmoCSUIProps, PlasmoGetOverlayAnchor, PlasmoWatchOverlayAnchor } from "plasmo";
import { isEnglishWord } from "~utils/word";
import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS } from "~utils/constants";
import styleText from 'data-text:../globals.css'
import { useSettings } from "~utils/settings";
import { sendToBackground } from "@plasmohq/messaging";
import React, { useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { clsx } from "clsx";
import WordCard from "~components/description";
import { useTheme } from "~utils/theme";
import { AnimatePresence, motion } from "motion/react";


function getSelection() {
    const selection = window.getSelection()

    // 如果没有有效的选区，清理可能残留的osmosis-selection元素
    if (
        selection == null ||
        selection.toString().trim() == '' ||
        selection.rangeCount == 0
    ) {
        const element = document.querySelector('osmosis-selection')
        if (element) {
            element.remove()
        }
        return
    }
    const range = selection.getRangeAt(0)
    const text = range.toString().trim()
    if (text === '' || !isEnglishWord(text)) {
        // 清理残留的osmosis-selection元素
        const element = document.querySelector('osmosis-selection')
        if (element) {
            element.remove()
        }
        return
    }
    const rect = range.getBoundingClientRect()
    let element: HTMLElement | null = document.querySelector('osmosis-selection')
    if (element == null) {
        element = document.createElement('osmosis-selection')
        document.body.appendChild(element)
    }
    element.style.pointerEvents = 'none'
    element.style.position = 'fixed'
    element.style.display = 'block'
    element.style.top = rect.top + 'px'
    element.style.left = rect.left + 'px'
    element.style.width = rect.width + 'px'
    element.style.height = rect.height + 'px'
    element.style.backgroundColor = 'transparent'

    element.dataset.key = text.toLowerCase().trim()
    element.dataset.text = text.trim()
    return element
}

function getTargetElement() {
    const target: HTMLElement | null = document.querySelector(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`)
    return target
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () => {
    return getSelection() || getTargetElement()
}


export const watchOverlayAnchor: PlasmoWatchOverlayAnchor = (
    updatePosition
) => {
    let timer: any
    const debounceUpdatePosition = () => {
        clearTimeout(timer)
        timer = setTimeout(updatePosition, 500)
    }

    window.addEventListener('resize', debounceUpdatePosition)
    window.addEventListener('scroll', debounceUpdatePosition)
    window.addEventListener('mouseup', debounceUpdatePosition)

    const interval = setInterval(() => {
        debounceUpdatePosition()
    }, 1000)

    // Clear the interval when unmounted
    return () => {
        clearInterval(interval)
        window.removeEventListener('resize', debounceUpdatePosition)
        window.removeEventListener('scroll', debounceUpdatePosition)
        window.removeEventListener('mouseup', debounceUpdatePosition)
    }
}

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
const Overlay: FC<PlasmoCSUIProps> = ({ anchor }) => {
    const anchorElement = anchor.element as HTMLElement
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

    // 判断anchor是否为选区元素
    const isSelection = anchorElement.tagName.toLowerCase() === 'osmosis-selection'

    // 从anchor元素获取data-key和data-text
    const dataKey = anchorElement.dataset.key || ''
    const dataText = anchorElement.dataset.text || ''

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
        if (!tooltipRef.current) return

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

    // 位置样式
    const getPositionStyles = (): React.CSSProperties | undefined => {
        const anchorRect = anchorElement.getBoundingClientRect()
        const baseStyles: React.CSSProperties = {
            position: 'fixed',
            zIndex: 2147483647,
        }

        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    bottom: `${window.innerHeight - anchorRect.top + 8}px`,
                    left: `${anchorRect.left + anchorRect.width / 2 + offset.x}px`,
                    transform: 'translateX(-50%)',
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: `${anchorRect.bottom + 8}px`,
                    left: `${anchorRect.left + anchorRect.width / 2 + offset.x}px`,
                    transform: 'translateX(-50%)',
                }
            case 'left':
                return {
                    ...baseStyles,
                    right: `${window.innerWidth - anchorRect.left + 8}px`,
                    top: `${anchorRect.top + anchorRect.height / 2 + offset.y}px`,
                    transform: 'translateY(-50%)',
                }
            case 'right':
                return {
                    ...baseStyles,
                    left: `${anchorRect.right + 8}px`,
                    top: `${anchorRect.top + anchorRect.height / 2 + offset.y}px`,
                    transform: 'translateY(-50%)',
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

        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    bottom: '-6px',
                    left: `calc(50% - ${offset.x}px)`,
                    transform: 'translateX(-50%)',
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--color-surface)',
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: '-6px',
                    left: `calc(50% - ${offset.x}px)`,
                    transform: 'translateX(-50%)',
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid var(--color-surface)',
                }
            case 'left':
                return {
                    ...baseStyles,
                    right: '-6px',
                    top: `calc(50% - ${offset.y}px)`,
                    transform: 'translateY(-50%)',
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderLeft: '6px solid var(--color-surface)',
                }
            case 'right':
                return {
                    ...baseStyles,
                    left: '-6px',
                    top: `calc(50% - ${offset.y}px)`,
                    transform: 'translateY(-50%)',
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: '6px solid var(--color-surface)',
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

    return (
        <div className={clsx("theme-root", { "dark": isDarkTheme })}>
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

export default Overlay   