import styleText from 'data-text:../globals.css'
import { clsx } from "clsx"
import React, { useMemo } from 'react'
import { useSettings } from "../utils/settings"
import { useTheme } from "~utils/theme"

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


  const comment = useMemo(() => {
    if (!settings.showTranslation) return null
    return (
      <span
        className={clsx(
          "absolute -top-[0.6em] left-0 w-full rounded-sm",
          "text-[0.6em] leading-[1em] select-none",
          "overflow-hidden whitespace-nowrap block",
          "select-none"
        )}
        style={{
          backgroundColor: settings.translationBgColor,
          color: settings.translationTextColor
        }}
      >
        <span className="inline-block relative animate-text-swing-scroll px-1">
          {text}
        </span>
      </span>
    )
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
      {comment}
    </span>

  )
}

