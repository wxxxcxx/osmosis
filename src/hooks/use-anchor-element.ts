import { useEffect, useMemo, useState } from "react"
import { getSelectionElement, getTargetElement } from "~utils/document"

export interface AnchorData {
    key: string
    text: string
    id: string
}

export interface UseAnchorElementResult {
    /** 当前的 anchor 元素 */
    anchorElement: HTMLElement | null
    /** 从 anchor 元素解析的数据 */
    data: AnchorData | null
    /** anchor 元素的位置信息 */
    rect: DOMRect | null
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
            const el = getSelectionElement() || getTargetElement()
            setAnchorElement(el)
        }

        const observer = new MutationObserver(updateAnchor)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        })

        // 监听选区变化
        document.addEventListener("selectionchange", updateAnchor)

        // 初始更新
        updateAnchor()

        return () => {
            observer.disconnect()
            document.removeEventListener("selectionchange", updateAnchor)
        }
    }, [])

    // 从 anchor 元素获取数据
    const data = useMemo<AnchorData | null>(() => {
        if (!anchorElement) return null
        return {
            key: anchorElement.dataset.key || '',
            text: anchorElement.dataset.text || '',
            id: anchorElement.dataset.id || '',
        }
    }, [anchorElement])

    // 获取 anchor 元素的位置
    const rect = useMemo(() => {
        if (!anchorElement) return null
        return anchorElement.getBoundingClientRect()
    }, [anchorElement])

    // 判断 anchor 是否为选区元素
    const isSelection = anchorElement?.tagName?.toLowerCase() === 'osmosis-selection'

    return {
        anchorElement,
        data,
        rect,
        isSelection
    }
}
