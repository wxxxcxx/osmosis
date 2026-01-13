import { sendToBackground } from '@plasmohq/messaging'
import { OSMOSIS_STARRED_WORD_TAG, TOOLTIP_SHOW_CLASS, TOOLTIP_CONTENT_CLASS } from '~utils/constants'

/**
 * 从文本中匹配所有英文单词，并返回它们的位置信息。
 * 
 * @param text - 要搜索的文本内容
 * @returns 包含单词及其位置信息的数组，每个元素包含:
 *          - word: 匹配到的单词
 *          - start: 单词在文本中的起始索引
 *          - end: 单词在文本中的结束索引
 * 
 * @example
 * matchWordsPositions("Hello world!")
 * // 返回: [{ word: "Hello", start: 0, end: 5 }, { word: "world", start: 6, end: 11 }]
 */
const matchWordsPositions = (text: string) => {
    // 匹配3到99个字母组成的英文单词（忽略过短的单词如 "a", "an"）
    const regex = /\b[a-zA-Z]{3,99}\b/g
    const positions = []
    let match: RegExpExecArray | null

    // 循环匹配所有单词
    while ((match = regex.exec(text)) !== null) {
        positions.push({
            word: match[0],
            start: match.index,
            end: match.index + match[0].length
        })
    }
    return positions
}

/**
 * NodeRender 类负责在页面中查找并高亮用户收藏（starred）的单词。
 * 
 * 工作原理:
 * 1. 从后台获取用户收藏的单词列表
 * 2. 遍历页面 DOM 树，找到所有文本节点
 * 3. 在文本节点中匹配收藏的单词
 * 4. 将匹配到的单词包装在自定义元素中（使用 OSMOSIS_STARRED_WORD_TAG 常量）
 * 5. 使用 MutationObserver 监听 DOM 变化，动态处理新增内容
 */
class NodeRender {
    /** 用户收藏的单词列表（小写形式） */
    keys: string[]

    /** DOM 变化观察器，用于监听页面动态内容 */
    observer: MutationObserver

    constructor() {
        this.keys = []

        // 初始化 MutationObserver，监听 DOM 变化
        const MutationObserver = window.MutationObserver
        this.observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                // 对每个新增的节点进行渲染处理
                mutation.addedNodes.forEach(async (node) => {
                    await this.renderNode(node)
                })
            }
        })
    }

    /**
     * 递归渲染节点，查找并高亮收藏的单词。
     * 
     * @param node - 要处理的 DOM 节点
     * 
     * 处理逻辑:
     * 1. 跳过不需要处理的节点（脚本、样式、代码块等）
     * 2. 处理已渲染的锚点元素（检查是否需要移除）
     * 3. 递归处理子节点
     * 4. 对文本节点进行单词匹配和高亮
     */
    async renderNode(node: Node) {
        const keys = this.keys

        // === 跳过不需要处理的节点类型 ===

        // 跳过脚本和样式标签，避免破坏页面功能
        if (node instanceof HTMLScriptElement || node instanceof HTMLStyleElement) {
            return
        }

        // 跳过代码块，保持代码显示的完整性
        if (node.nodeName == 'PRE' || node.nodeName == 'CODE') {
            return
        }

        // === 处理已经渲染过的锚点元素 ===
        if (node.nodeName == OSMOSIS_STARRED_WORD_TAG) {
            const element = node as HTMLElement
            const key = element.dataset.key
            const text = element.dataset.text

            // 如果该单词已不在收藏列表中，还原为普通文本
            if (!keys.includes(key)) {
                const textNode = document.createTextNode(text)
                node.parentNode.replaceChild(textNode, node)
            }
            return
        }

        // 跳过提示框中的内容，避免在 tooltip 中重复高亮
        if ((node as HTMLElement).classList?.contains(TOOLTIP_CONTENT_CLASS)) {
            return
        }

        // === 递归处理子节点 ===
        if (node.childNodes.length > 0) {
            // 先将子节点转为数组，防止在遍历过程中因 DOM 修改导致死循环
            const childNodes = Array.from(node.childNodes)
            for (const child of childNodes) {
                await this.renderNode(child)
            }
            return
        }

        // === 处理文本节点 ===

        // 只处理文本节点
        if (node.nodeType != Node.TEXT_NODE) {
            return
        }

        // 跳过空白文本
        if (node.textContent == undefined || node.textContent.trim() == '') {
            return
        }

        let content = node.textContent

        // 获取所有单词位置，倒序处理以避免索引偏移问题
        // （从后向前处理，这样前面的索引不会因为修改而失效）
        const positions = matchWordsPositions(content).reverse()
        const textNode = node as Text

        for (const position of positions) {
            // 检查单词是否在收藏列表中（不区分大小写）
            if (keys.includes(position.word.toLowerCase())) {
                let wordNode = null

                // 判断是否需要分割文本节点
                if (textNode.textContent.toLowerCase() == position.word.toLowerCase()) {
                    // 整个文本节点就是这个单词，无需分割
                    wordNode = textNode
                } else {
                    // 使用 splitText 将单词从文本中分离出来
                    // 先在单词结尾处分割，再在单词开头处分割
                    textNode.splitText(position.end)
                    textNode.splitText(position.start)
                    // 分割后，目标单词位于 nextSibling
                    wordNode = textNode.nextSibling
                }

                // 创建自定义锚点元素来包装单词
                const xWordNode = document.createElement(OSMOSIS_STARRED_WORD_TAG)
                // 存储单词的 key（小写）和原始文本
                xWordNode.dataset.key = wordNode.textContent.toLowerCase().trim()
                xWordNode.dataset.text = wordNode.textContent
                xWordNode.dataset.id = crypto.randomUUID()
                xWordNode.style.position = 'relative'
                xWordNode.innerText = wordNode.textContent

                // 鼠标移入单词时，显示tooltip
                xWordNode.addEventListener('mouseenter', () => {
                    // 清除可能存在的隐藏timeout
                    if (xWordNode.dataset.hideTimeoutId) {
                        clearTimeout(Number(xWordNode.dataset.hideTimeoutId))
                        delete xWordNode.dataset.hideTimeoutId
                    }
                    // 移除其他单词的tooltip显示状态
                    document.querySelectorAll(`${OSMOSIS_STARRED_WORD_TAG}.${TOOLTIP_SHOW_CLASS}`).forEach((item) => {
                        // 清除其他单词的timeout
                        if ((item as HTMLElement).dataset.hideTimeoutId) {
                            clearTimeout(Number((item as HTMLElement).dataset.hideTimeoutId))
                            delete (item as HTMLElement).dataset.hideTimeoutId
                        }
                        item.classList.remove(TOOLTIP_SHOW_CLASS)
                    })
                    // 为当前单词添加tooltip显示状态
                    xWordNode.classList.add(TOOLTIP_SHOW_CLASS)
                })

                // // 鼠标移出单词时，延迟隐藏tooltip
                // xWordNode.addEventListener('mouseleave', () => {
                //     // 延迟200ms后隐藏，给用户时间移入tooltip
                //     const timeoutId = setTimeout(() => {
                //         xWordNode.classList.remove(TOOLTIP_SHOW_CLASS)
                //         delete xWordNode.dataset.hideTimeoutId
                //     }, 200)
                //     // 将timeout ID存储在元素上，以便tooltip可以取消它
                //     xWordNode.dataset.hideTimeoutId = String(timeoutId)
                // })

                // 用锚点元素替换原来的文本节点
                wordNode.parentNode?.replaceChild(xWordNode, wordNode)
            }
        }
    }

    /**
     * 开始渲染流程：获取收藏列表并渲染整个页面。
     * 
     * 调用时机: 页面加载完成后，或收藏列表更新后
     */
    async render() {
        try {
            // 从后台 Service Worker 获取收藏的单词列表
            const response = await sendToBackground({
                name: 'list'
            })
            this.keys = response.keys

            // 从 document.body 开始递归渲染
            await this.renderNode(document.body)
        } catch (error) {
            console.error("Osmosis: Failed to render nodes", error)
        }
    }

    /**
     * 开始监听 DOM 变化。
     * 
     * 用于处理动态加载的内容（如无限滚动、AJAX 加载等）
     */
    observe() {
        this.observer.observe(document.body, {
            childList: true,  // 监听子节点的添加/删除
            subtree: true     // 监听所有后代节点
        })
    }

    /**
     * 停止监听 DOM 变化。
     * 
     * 用于清理资源，如扩展卸载时
     */
    disconnect() {
        this.observer.disconnect()
    }
}


const renderer = new NodeRender()
renderer.render()
renderer.observe()
export default {
    renderer: renderer
}
