import styleText from 'data-text:../globals.css'
import type {
  PlasmoCSUIJSXContainer,
  PlasmoGetInlineAnchor,
  PlasmoRender
} from 'plasmo'
import React from 'react'
import { createRoot } from 'react-dom/client'

import { sendToBackground } from '@plasmohq/messaging'

import { isEnglishWord } from '~utils/word'

import { clsx } from "clsx"
import { useSettings } from "../utils/settings"
import WordCard from '../components/word-card'
import Tooltip from '../components/ui/tooltip'

const querySelection = (e: MouseEvent) => {
  document.querySelectorAll('.xtooltip-query-anchor').forEach((element) => {
    const root = (element as any)._reactRoot
    if (root) {
      setTimeout(() => {
        root.unmount()
        element.remove()
      }, 0)
    } else {
      element.remove()
    }
  })

  const selection = window.getSelection()
  if (
    selection == null ||
    selection.toString().trim() == '' ||
    selection.rangeCount == 0
  ) {
    return
  }
  const range = selection.getRangeAt(0)
  const text = range.toString().trim()
  if (text === '' || !isEnglishWord(text)) {
    return
  }
  const rect = range.getBoundingClientRect()
  const element = document.createElement('div')
  element.className = 'xtooltip-query-anchor'
  element.style.position = 'fixed'
  element.style.pointerEvents = 'none'
  // element.style.backgroundColor = '#55ff0099'
  element.style.display = 'block'
  element.style.top = rect.top + 'px'
  element.style.left = rect.left + 'px'
  element.style.width = range.getBoundingClientRect().width + 'px'
  element.style.height = range.getBoundingClientRect().height + 'px'
  element.dataset.key = text.toLowerCase().trim()
  element.dataset.text = text
  document.body.appendChild(element)
}
document.body.addEventListener('mouseup', querySelection)

function QueryToolTip(props: any) {
  const [settings] = useSettings()
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    if (!settings) return
    const checkDark = () => {
      if (settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        setIsDark(true)
      } else {
        setIsDark(false)
      }
    }
    checkDark()
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", checkDark)
    return () => mediaQuery.removeEventListener("change", checkDark)
  }, [settings?.theme])

  return (
    <div className={clsx('block theme-root', { "dark": isDark })}>
      <style>{styleText}</style>
      <Tooltip
        trigger={
          <div
            className={clsx("select-none")}
            style={{
              width: props.rect?.width || "auto",
              height: props.rect?.height || "auto"
            }}
          >
          </div>
        }
        className="tooltip"
        defaultOpen={true}
        on={'click'}
      >
        {props.data.code == 0 ? (
          <WordCard text={props.text} data={props.data} />
        ) : (
          props.data.message
        )}
      </Tooltip>
    </div>
  )
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () =>
  document.querySelector('.xtooltip-query-anchor')

// This function overrides the default `createRootContainer`
export const getRootContainer = () => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const rootContainer = document.querySelectorAll('.xtooltip-query-anchor')
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
    ; (rootContainer as any)._reactRoot = root
  const key = rootContainer.dataset.key
  const text = rootContainer.dataset.text
  const rect = {
    width: rootContainer.style.width,
    height: rootContainer.style.height
  }

  try {
    const response = await sendToBackground({
      name: 'query',
      body: {
        key: key
      }
    })
    root.render(
      <QueryToolTip text={text} data={response} rect={rect}></QueryToolTip>
    )
  } catch (error) {
    console.error("Familiarity: Failed to render query tooltip", error)
  }
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

export default QueryToolTip
