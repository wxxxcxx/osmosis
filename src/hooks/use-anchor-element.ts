import { useEffect, useMemo, useState } from "react"
import { checkVisible, getSelectionElement, getTargetElement } from "~utils/document"

export interface AnchorData {
    wordKey: string
    text: string
    id: string
}

export interface UseAnchorElementResult {
    /** 当前的 anchor 元素 */
    anchorElement: HTMLElement | null
    /** 从 anchor 元素解析的数据 */
    anchorData: AnchorData | null
    /** 是否为选区元素 */
    isSelection: boolean
}

/**
 * 监听并管理 tooltip 的 anchor 元素
 * 
 * 通过 MutationObserver 和 selectionchange 事件监听 DOM 变化，
 * 自动获取当前需要显示 tooltip 的目标元素
 */
export function useAnchorElement(): UseAnchorElementResult {
    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

    useEffect(() => {
        const updateAnchor = () => {
            // 独立检查：优先选区，选区不可见时 fallback 到 target 元素
            const selectionEl = getSelectionElement()
            const visibleSelection = checkVisible(selectionEl)

            if (visibleSelection) {
                setAnchorElement(visibleSelection)
                return
            }

            const targetEl = getTargetElement()
            const visibleTarget = checkVisible(targetEl)
            setAnchorElement(visibleTarget)
        }

        const observer = new MutationObserver(updateAnchor)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        })

        // 监听交互和滚动变化
        document.addEventListener("mouseup", updateAnchor)
        document.addEventListener("selectionchange", updateAnchor)
        window.addEventListener("scroll", updateAnchor, { passive: true, capture: true })

        updateAnchor()

        return () => {
            observer.disconnect()
            document.removeEventListener("mouseup", updateAnchor)
            document.removeEventListener("selectionchange", updateAnchor)
            window.removeEventListener("scroll", updateAnchor, { capture: true })
        }
    }, [])

    // 从 anchor 元素获取数据
    const anchorData = useMemo<AnchorData | null>(() => {
        console.log(anchorElement)
        if (!anchorElement) return null
        const result = {
            wordKey: anchorElement.dataset.key || '',
            text: anchorElement.dataset.text || '',
            id: anchorElement.dataset.id || '',
        }
        console.log('Anchor data:', result)
        return result
    }, [anchorElement?.dataset.id])

    // 判断 anchor 是否为选区元素
    const isSelection = anchorElement?.tagName?.toLowerCase() === 'osmosis-selection'

    return {
        anchorElement,
        anchorData,
        isSelection
    }
}
