import type { PlasmoCSUIJSXContainer, PlasmoGetInlineAnchorList, PlasmoRender } from "plasmo";
import { createRoot } from "react-dom/client";
import { OSMOSIS_STARRED_WORD_TAG } from "~utils/constants";

/**
 * 蓝色半透明遮罩组件
 * 用于高亮显示被标记的单词
 */
function Decorator() {
    return (
        <span
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500 with 20% opacity
                borderRadius: '2px',
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    )
}

export default Decorator

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
    document.querySelectorAll(OSMOSIS_STARRED_WORD_TAG)

export const getRootContainer = () => {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const rootContainer = document.querySelectorAll(OSMOSIS_STARRED_WORD_TAG)
            if (rootContainer && rootContainer.length > 0) {
                clearInterval(checkInterval)
                resolve(rootContainer)
            }
        }, 1000)
    })
}

const DECORATOR_CLASS = 'osmosis-decorator-container'

const renderRootContainer = async (rootContainer: HTMLElement) => {
    // 检查是否已经渲染过 decorator
    if (rootContainer.querySelector(`.${DECORATOR_CLASS}`)) {
        return
    }

    // 创建一个容器来放置 decorator
    const decoratorContainer = document.createElement('span')
    decoratorContainer.className = DECORATOR_CLASS
    decoratorContainer.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;'

    // 将容器添加到 rootContainer 的开头
    rootContainer.insertBefore(decoratorContainer, rootContainer.firstChild)

    // 使用 React 渲染 decorator
    const root = createRoot(decoratorContainer)
    root.render(<Decorator />)
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
    createRootContainer
}) => {
    const rootContainer = await createRootContainer()
    if (rootContainer instanceof NodeList) {
        rootContainer.forEach((container) => {
            renderRootContainer(container as HTMLElement)
        })
    } else {
        await renderRootContainer(rootContainer as HTMLElement)
    }
}
