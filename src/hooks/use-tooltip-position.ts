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
    anchorRect: DOMRect | null,
    deps: React.DependencyList = []
): UseTooltipPositionResult {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<TooltipPosition>('bottom')
    const [offset, setOffset] = useState<TooltipOffset>({ x: 0, y: 0 })
    const [actualSize, setActualSize] = useState({ width: 300, height: 300 })

    // 预设尺寸用于初始计算，实际计算将使用真实测量值
    const TOOLTIP_WIDTH = actualSize.width
    const TOOLTIP_HEIGHT = actualSize.height

    // 监听尺寸变化
    useLayoutEffect(() => {
        if (!tooltipRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width > 0 && height > 0) {
                    setActualSize({ width, height })
                }
            }
        })

        observer.observe(tooltipRef.current)
        return () => observer.disconnect()
    }, [])

    // 计算位置
    useLayoutEffect(() => {
        if (!anchorRect) return

        const { position: newPosition, offset: newOffset } = calculateBestPosition(
            anchorRect,
            TOOLTIP_WIDTH,
            TOOLTIP_HEIGHT
        )

        setPosition(newPosition)
        setOffset(newOffset)
    }, [anchorRect, TOOLTIP_WIDTH, TOOLTIP_HEIGHT, ...deps])

    // 位置样式 - 基于视口 (0,0) 计算绝对位置
    const getPositionStyles = (): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: 'absolute',
        }

        if (!anchorRect) return baseStyles

        const tooltipWidth = TOOLTIP_WIDTH
        const tooltipHeight = TOOLTIP_HEIGHT

        const scrollY = window.scrollY
        const scrollX = window.scrollX
        const gap = 8

        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const anchorCenterY = anchorRect.top + anchorRect.height / 2

        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    // top 指向 anchor 顶部，实际位置由 y: -100% 修正
                    top: `${anchorRect.top + scrollY - gap}px`,
                    left: `${anchorCenterX + scrollX - tooltipWidth / 2 + offset.x}px`,
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: `${anchorRect.bottom + scrollY + gap}px`,
                    left: `${anchorCenterX + scrollX - tooltipWidth / 2 + offset.x}px`,
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
        initial: { opacity: 0, y: 'calc(-100% + 8px)' },
        animate: { opacity: 1, y: '-100%' },
        exit: { opacity: 0, y: 'calc(-100% + 8px)' },
    },
    bottom: {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
    },
}
