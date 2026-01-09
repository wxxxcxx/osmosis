import styleText from 'data-text:../globals.css'
import type {
  PlasmoCSUIJSXContainer,
  PlasmoGetInlineAnchorList,
  PlasmoRender
} from 'plasmo'
import React from 'react'
import { createRoot } from 'react-dom/client'

import { sendToBackground } from '@plasmohq/messaging'

import { clsx } from 'clsx'
import { useSettings } from '../utils/settings'
import WordCard from '../components/description'
import Highlight from '../components/highlight'
import Tooltip from '../components/ui/tooltip'
import api from './renderer'

(async () => {
  window.addEventListener('load', async () => {
    try {
      await api.renderer.render()
      api.renderer.observe()
    } catch (error) {
      console.error("Familiarity: Failed to initialize renderer", error)
    }
  })
})()

function StarTooltip(props: any) {
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
    <div className={clsx("inline theme-root", { "dark": isDark })}>
      <style>{styleText}</style>
      <Tooltip
        trigger={
          <span>
            <Highlight text={props.text} data={props.data}></Highlight>
          </span>
        }
        className="tooltip"
        on={'hover'}>
        {props.data.code == 0 ? (
          <WordCard text={props.text} data={props.data}></WordCard>
        ) : (
          props.data.message
        )}
      </Tooltip>
    </div>
  )
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  document.querySelectorAll('xtooltip-star-anchor')

// This function overrides the default `createRootContainer`
export const getRootContainer = () => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const rootContainer = document.querySelectorAll('xtooltip-star-anchor')
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
  try {
    const response = await sendToBackground({
      name: 'query',
      body: {
        key: key
      }
    })
    root.render(<StarTooltip text={text} data={response}></StarTooltip>)
  } catch (error) {
    console.error("Familiarity: Failed to render tooltip content", error)
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

export default StarTooltip
