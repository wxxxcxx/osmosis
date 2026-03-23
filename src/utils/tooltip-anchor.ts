import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS } from "./constants"

const tooltipHideTimers = new WeakMap<HTMLElement, number>()

const DEFAULT_HIDE_DELAY = 120

export function cancelTooltipHide(anchor: HTMLElement) {
    const timerId = tooltipHideTimers.get(anchor)

    if (timerId !== undefined) {
        window.clearTimeout(timerId)
        tooltipHideTimers.delete(anchor)
    }
}

export function showTooltipForAnchor(anchor: HTMLElement) {
    cancelTooltipHide(anchor)

    document
        .querySelectorAll<HTMLElement>(`${OSMOSIS_STARRED_WORD_TAG.toLowerCase()}.${TOOLTIP_SHOW_CLASS}`)
        .forEach((item) => {
            if (item !== anchor) {
                item.classList.remove(TOOLTIP_SHOW_CLASS)
            }
        })

    anchor.classList.add(TOOLTIP_SHOW_CLASS)
}

export function scheduleTooltipHide(anchor: HTMLElement, delay = DEFAULT_HIDE_DELAY) {
    cancelTooltipHide(anchor)

    const timerId = window.setTimeout(() => {
        anchor.classList.remove(TOOLTIP_SHOW_CLASS)
        tooltipHideTimers.delete(anchor)
    }, delay)

    tooltipHideTimers.set(anchor, timerId)
}
