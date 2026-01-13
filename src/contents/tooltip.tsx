import type { PlasmoGetOverlayAnchor, PlasmoWatchOverlayAnchor } from "plasmo";
import { isEnglishWord } from "~utils/word";
import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS } from "~utils/constants";

// 导入提取的 Overlay 组件
export { default } from "~components/tooltip-overlay";


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
    element.style.position = 'absolute'
    element.style.display = 'block'
    element.style.top = (rect.top + window.scrollY) + 'px'
    element.style.left = (rect.left + window.scrollX) + 'px'
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
    const anchor = getSelection() || getTargetElement()
    return anchor
}


export const watchOverlayAnchor: PlasmoWatchOverlayAnchor = (
    updatePosition
) => {
    let timer: any
    const debounceUpdatePosition = (delay: number = 100) => {
        clearTimeout(timer)
        timer = setTimeout(updatePosition, delay)
    }

    // 立即更新位置（用于鼠标在 starred 单词间移动时）
    const immediateUpdatePosition = () => {
        clearTimeout(timer)
        updatePosition()
    }

    // 监听 starred 单词上的 mouseover 事件，实现快速切换
    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName?.toUpperCase() === OSMOSIS_STARRED_WORD_TAG) {
            // 鼠标移入 starred 单词时立即更新位置
            immediateUpdatePosition()
        }
    }

    window.addEventListener('resize', () => debounceUpdatePosition(100))
    window.addEventListener('scroll', () => debounceUpdatePosition(100))
    window.addEventListener('mouseup', () => debounceUpdatePosition(100))
    document.addEventListener('mouseover', handleMouseOver)

    const interval = setInterval(() => {
        debounceUpdatePosition(500)
    }, 1000)

    // Clear the interval when unmounted
    return () => {
        clearInterval(interval)
        window.removeEventListener('resize', () => debounceUpdatePosition(100))
        window.removeEventListener('scroll', () => debounceUpdatePosition(100))
        window.removeEventListener('mouseup', () => debounceUpdatePosition(100))
        document.removeEventListener('mouseover', handleMouseOver)
    }
}