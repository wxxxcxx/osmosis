import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS } from "./constants"
import { isEnglishWord } from "./word"

export function getSelectionElement() {
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
    element.dataset.id = crypto.randomUUID()
    return element
}

export function getTargetElement() {
    const target: HTMLElement | null = document.querySelector(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`)
    return target
}

export function checkVisible(el: HTMLElement | null): HTMLElement | null {
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const isInViewport =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
    return isInViewport ? el : null
}
