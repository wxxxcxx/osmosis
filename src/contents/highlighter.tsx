import { sendToBackground } from "@plasmohq/messaging";
import type { PlasmoCSUIJSXContainer, PlasmoGetInlineAnchorList, PlasmoRender } from "plasmo";
import { createRoot } from "react-dom/client";
import Highlight from "~components/highlight";
import { OSMOSIS_STARRED_WORD_TAG } from "~utils/constants";


export default Highlight


export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(OSMOSIS_STARRED_WORD_TAG)


export const getRootContainer = () => {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const rootContainer = document.querySelectorAll(OSMOSIS_STARRED_WORD_TAG)
            if (rootContainer) {
                clearInterval(checkInterval)
                resolve(rootContainer)
            }
        }, 1000)
    })
}

const renderRootContainer = async (rootContainer: HTMLElement) => {
    if (rootContainer.shadowRoot) {
        return
    }
    const shadow = rootContainer.attachShadow({ mode: 'open' })
    const root = createRoot(shadow)
    const key = rootContainer.dataset.key
    const text = rootContainer.dataset.text
    root.render(<Highlight key={key} text={text}></Highlight>)
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
    createRootContainer // This creates the default root container
}) => {

    const rootContainer = await createRootContainer()
    if (rootContainer instanceof NodeList) {
        // console.log('Refresh! Root count:', rootContainer.length)
        rootContainer.forEach((container) => {
            const rootContainer = container as HTMLElement
            renderRootContainer(rootContainer)
        })
    } else {
        await renderRootContainer(rootContainer as HTMLElement)
    }
}