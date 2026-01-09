import { sendToBackground } from '@plasmohq/messaging'

const matchWordsPositions = (text: string) => {
  const regex = /\b[a-zA-Z]{3,99}\b/g // 正则表达式匹配英文单词
  const positions = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    positions.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }
  return positions
}

class NodeRender {
  keys: string[]
  observer: MutationObserver

  constructor() {
    this.keys = []
    const MutationObserver = window.MutationObserver
    this.observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        mutation.addedNodes.forEach(async (node) => {
          await this.renderNode(node)
        })
      }
    })
  }

  async renderNode(node: Node) {
    const keys = this.keys
    if (node instanceof HTMLScriptElement || node instanceof HTMLStyleElement) {
      return
    }
    if (node.nodeName == 'PRE' || node.nodeName == 'CODE') {
      return
    }
    if (node.nodeName == 'XTOOLTIP-STAR-ANCHOR') {
      // 跳过已经渲染过的单词
      const element = node as HTMLElement
      const key = element.dataset.key
      const text = element.dataset.text
      if (!keys.includes(key)) {
        const textNode = document.createTextNode(text)
        node.parentNode.replaceChild(textNode, node)
      }
      return
    }
    if ((node as HTMLElement).classList?.contains('tooltip-content')) {
      // 跳过提示框中的内容
      return
    }

    if (node.childNodes.length > 0) {
      // 防止子元素数量变化导致的死循环
      const childNodes = Array.from(node.childNodes)
      for (const child of childNodes) {
        await this.renderNode(child)
      }
      return
    }
    if (node.nodeType != Node.TEXT_NODE) {
      return
    }
    if (node.textContent == undefined || node.textContent.trim() == '') {
      return
    }
    // console.log('Ready to render node:', node)
    let content = node.textContent
    const positions = matchWordsPositions(content).reverse()
    const textNode = node as Text
    for (const position of positions) {
      if (keys.includes(position.word.toLowerCase())) {
        let wordNode = null
        if (textNode.textContent.toLowerCase() == position.word.toLowerCase()) {
          wordNode = textNode
        } else {
          textNode.splitText(position.end)
          textNode.splitText(position.start)
          wordNode = textNode.nextSibling
        }
        const xWordNode = document.createElement('xtooltip-star-anchor')
        xWordNode.dataset.key = wordNode.textContent.toLowerCase().trim()
        xWordNode.dataset.text = wordNode.textContent
        xWordNode.style.overflow = 'visible'
        xWordNode.innerText = wordNode.textContent
        wordNode.parentNode?.replaceChild(xWordNode, wordNode)
      }
    }
  }

  async render() {
    try {
      const response = await sendToBackground({
        name: 'list'
      })
      this.keys = response.keys
      await this.renderNode(document.body)
    } catch (error) {
      console.error("Osmosis: Failed to render nodes", error)
    }
  }

  observe() {
    this.observer.observe(document.body, { childList: true, subtree: true })
  }

  disconnect() {
    this.observer.disconnect()
  }
}

export default {
  renderer: new NodeRender()
}
