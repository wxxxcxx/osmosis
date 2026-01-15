import React, { useLayoutEffect, useRef, useState } from "react"

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

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
    getPositionStyles: () => React.CSSProperties | undefined
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

    // 计算位置
    useLayoutEffect(() => {
        if (!tooltipRef.current || !anchorRect) return

        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const { position: newPosition, offset: newOffset } = calculateBestPosition(
            anchorRect,
            tooltipRect.width,
            tooltipRect.height
        )

        setPosition(newPosition)
        setOffset(newOffset)
    }, [anchorRect, ...deps])

    // 位置样式 - 基于视口 (0,0) 计算绝对位置
    const getPositionStyles = (): React.CSSProperties | undefined => {
        if (!anchorRect || !tooltipRef.current) return undefined

        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const tooltipWidth = tooltipRect.width || 300
        const tooltipHeight = tooltipRect.height || 100

        const baseStyles: React.CSSProperties = {
            position: 'fixed',
            zIndex: 2147483647,
        }

        const gap = 8

        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const anchorCenterY = anchorRect.top + anchorRect.height / 2

        switch (position) {
            case 'top':
                return {
                    ...baseStyles,
                    top: `${anchorRect.top - tooltipHeight - gap}px`,
                    left: `${anchorCenterX - tooltipWidth / 2 + offset.x}px`,
                }
            case 'bottom':
                return {
                    ...baseStyles,
                    top: `${anchorRect.bottom + gap}px`,
                    left: `${anchorCenterX - tooltipWidth / 2 + offset.x}px`,
                }
            case 'left':
                return {
                    ...baseStyles,
                    left: `${anchorRect.left - tooltipWidth - gap}px`,
                    top: `${anchorCenterY - tooltipHeight / 2 + offset.y}px`,
                }
            case 'right':
                return {
                    ...baseStyles,
                    left: `${anchorRect.right + gap}px`,
                    top: `${anchorCenterY - tooltipHeight / 2 + offset.y}px`,
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
    initial: { opacity: number; x?: number; y?: number }
    animate: { opacity: number; x?: number; y?: number }
    exit: { opacity: number; x?: number; y?: number }
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
    left: {
        initial: { opacity: 0, x: 8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 8 },
    },
    right: {
        initial: { opacity: 0, x: -8 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -8 },
    },
}
