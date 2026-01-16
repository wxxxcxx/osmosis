import React, { useLayoutEffect, useRef, useState } from "react"

export type TooltipPosition = 'top' | 'bottom'

export interface TooltipOffset {
    x: number
    y: number
}

export interface UseTooltipPositionResult {
    /** tooltip 容器的 ref */
    tooltipRef: React.RefObject<HTMLDivElement>
    /** 计算出的位置方向 */
    position: TooltipPosition
    /** 边界修正偏移量 */
    offset: TooltipOffset
    /** 获取 tooltip 的位置样式 */
    getPositionStyles: () => React.CSSProperties
    /** 获取箭头的样式 */
    getArrowStyles: () => React.CSSProperties
}

/**
 * 计算 tooltip 的最佳位置
 */
function calculateBestPosition(
    anchorRect: DOMRect,
    tooltipWidth: number,
    tooltipHeight: number
): { position: TooltipPosition; offset: TooltipOffset } {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const margin = 10

    const spaceTop = anchorRect.top
    const spaceBottom = viewportHeight - anchorRect.bottom
    const spaceLeft = anchorRect.left
    const spaceRight = viewportWidth - anchorRect.right

    const requiredHeight = tooltipHeight + margin
    const requiredWidth = tooltipWidth + margin

    // 优先选择下方，其次上方
    let position: TooltipPosition = 'bottom'

    if (spaceBottom >= requiredHeight) {
        position = 'bottom'
    } else {
        position = 'top'
    }

    // 计算偏移量，确保 tooltip 不超出视口
    let offsetX = 0
    let offsetY = 0

    if (position === 'top' || position === 'bottom') {
        // 水平居中对齐 anchor
        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const tooltipLeft = anchorCenterX - tooltipWidth / 2
        const tooltipRight = anchorCenterX + tooltipWidth / 2

        if (tooltipLeft < margin) {
            offsetX = margin - tooltipLeft
        } else if (tooltipRight > viewportWidth - margin) {
            offsetX = (viewportWidth - margin) - tooltipRight
        }
    } else {
        // 垂直居中对齐 anchor
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

/**
 * 管理 tooltip 的位置计算
 * 
 * 根据 anchor 元素的位置和 tooltip 的尺寸，
 * 自动计算最佳显示位置和边界修正偏移
 * 
 * @param anchorRect - anchor 元素的位置信息
 * @param deps - 额外的依赖项，变化时触发重新计算
 */
export function useTooltipPosition(
    anchorElement: HTMLElement | null,
    deps: React.DependencyList = []
): UseTooltipPositionResult {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<TooltipPosition>('bottom')
    const [offset, setOffset] = useState<TooltipOffset>({ x: 0, y: 0 })
    const [actualSize, setActualSize] = useState({ width: 300, height: 300 })

    // 用于计算方向的参考高度，使用最大高度以保证加载过程中的方向稳定性
    const STABLE_HEIGHT = 300
    const STABLE_WIDTH = 300

    // 监听尺寸变化
    useLayoutEffect(() => {
        if (!tooltipRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const rect = entry.target.getBoundingClientRect()
                if (rect.width > 0 && rect.height > 0) {
                    setActualSize({ width: rect.width, height: rect.height })
                }
            }
        })

        observer.observe(tooltipRef.current)
        return () => observer.disconnect()
    }, [])

    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

    // 监听元素位置变化
    useLayoutEffect(() => {
        const updateRect = () => {
            if (anchorElement) {
                setAnchorRect(anchorElement.getBoundingClientRect())
            } else {
                setAnchorRect(null)
            }
        }

        updateRect()
        window.addEventListener("resize", updateRect)
        window.addEventListener("scroll", updateRect, { capture: true, passive: true })

        return () => {
            window.removeEventListener("resize", updateRect)
            window.removeEventListener("scroll", updateRect, { capture: true })
        }
    }, [anchorElement])

    // 计算位置方向（基于稳定尺寸，防止加载时方向跳动）
    useLayoutEffect(() => {
        if (!anchorRect) return

        const { position: newPosition, offset: newOffset } = calculateBestPosition(
            anchorRect,
            STABLE_WIDTH,
            STABLE_HEIGHT
        )

        setPosition(newPosition)
        setOffset(newOffset)
    }, [anchorRect, ...deps])

    // 位置样式 - 基于视口 (0,0) 计算绝对位置
    const getPositionStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: 'fixed',
        }

        if (!anchorRect) return baseStyles

        const tooltipWidth = actualSize.width
        const tooltipHeight = actualSize.height

        const scrollY = window.scrollY
        const scrollX = window.scrollX
        const gap = 8

        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const viewportHeight = window.innerHeight

        switch (position) {
            case 'top':
                // 增加 gap (从 8px 增加到 20px) 以避开单词上方的 Comment 标签
                return {
                    ...baseStyles,
                    // fixed 定位下，使用视口高度计算 bottom
                    bottom: `${viewportHeight - anchorRect.top + gap}px`,
                    left: `${anchorCenterX - tooltipWidth / 2 + offset.x}px`,
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: `${anchorRect.bottom + gap}px`,
                    left: `${anchorCenterX - tooltipWidth / 2 + offset.x}px`,
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
            default:
                return baseStyles
        }
    }

    return {
        tooltipRef,
        position,
        offset,
        getPositionStyles,
        getArrowStyles
    }
}

/** 动画变体配置 */
export const tooltipAnimationVariants: Record<TooltipPosition, {
    initial: { opacity: number; x?: number | string; y?: number | string }
    animate: { opacity: number; x?: number | string; y?: number | string }
    exit: { opacity: number; x?: number | string; y?: number | string }
}> = {
    top: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 8 },
    },
    bottom: {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
    },
}
