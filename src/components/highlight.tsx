import styleText from 'data-text:../globals.css'
import { clsx } from "clsx"
import React, { useMemo } from 'react'
import { useSettings } from "../utils/settings"
import { useTheme } from "~utils/theme"
import Comment from "./comment"

export default function Highlight({
  wordKey,
  text,
}: {
  wordKey: string
  text: string
}) {
  const isDarkTheme = useTheme()
  const [settings] = useSettings()
  if (!settings) return <>{text}</>

  const decorationClass = useMemo(() => {
    switch (settings.highlightStyle) {
      case "wavy":
        return "decoration-wavy"
      case "solid":
        return "decoration-solid"
      case "dotted":
        return "decoration-dotted"
      case "dashed":
        return "decoration-dashed"
      case "none":
        return "decoration-none"
      default:
        return "decoration-wavy"
    }
  }, [settings])

  return (
    <span className={clsx("inline theme-root", { "dark": isDarkTheme })}>
      <style>{styleText}</style>
      <span
        className={clsx(
          "relative cursor-pointer overflow-visible mb-1",
          "underline decoration-auto underline-offset-2",
          decorationClass,
        )}
        style={{
          textDecorationColor: settings.highlightColor
        }}
      >
        {text}
      </span>
      {settings.showComment && <Comment wordKey={wordKey} />}
    </span>
  )
}


