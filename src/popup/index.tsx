import { clsx } from "clsx"
import React, { useState, useEffect } from "react"
import { Settings as SettingsIcon, Loader2 } from "lucide-react"

import "../globals.css"

import { sendToBackground } from "@plasmohq/messaging"
import { useSettings } from "../utils/settings"
import { useQuery, useMutation } from "~hooks/use-query"
import { useTranslation } from "~utils/i18n"

interface WordItemProps {
  word: string
  onUnstar: (word: string) => void
  isUnstarring: boolean
}

const WordItem: React.FC<WordItemProps> = ({ word, onUnstar, isUnstarring }) => {
  return (
    <div
      className={clsx(
        "flex flex-row items-center p-2.5 box-border w-full transition-all duration-500 rounded-sm",
        "hover:bg-main/50 text-text-primary",
        isUnstarring && "opacity-50"
      )}
    >
      <div className={clsx("flex-grow text-[1.2em] font-light")}>{word}</div>
      <button
        className={clsx(
          "cursor-pointer text-text-muted border-none outline-none text-[1.2em] transition-all duration-500 bg-transparent",
          "hover:scale-[1.2] hover:rotate-[72deg] hover:text-star-text",
          "active:scale-[0.8]",
          isUnstarring && "cursor-wait"
        )}
        onClick={() => onUnstar(word)}
        disabled={isUnstarring}
      >
        ★
      </button>
    </div>
  )
}

interface WordListProps {
  filterKey: string
}

const WordListComponent: React.FC<WordListProps> = ({ filterKey }) => {
  const { t } = useTranslation(['popup', 'common'])
  const [unstarringWord, setUnstarringWord] = useState<string | null>(null)

  // 内联使用 useQuery 获取单词列表
  const { data, isLoading, error, refetch } = useQuery<{ keys: string[] }>(
    ["word-list"],
    async () => {
      return await sendToBackground({ name: "list" })
    }
  )

  // 内联使用 useMutation 处理取消收藏
  const { mutate: unstar } = useMutation<{ code: number; message: string | null }, string>(
    async (wordKey) => {
      return await sendToBackground({
        name: "unstar",
        body: { key: wordKey }
      })
    },
    {
      onSuccess: (response) => {
        setUnstarringWord(null)
        if (response.code === 0) {
          refetch()
        } else {
          console.error("Osmosis: Unstar failed:", response.message)
        }
      },
      onError: (err) => {
        setUnstarringWord(null)
        console.error("Osmosis: Unstar error:", err)
      }
    }
  )

  const handleUnstar = async (word: string) => {
    setUnstarringWord(word)
    await unstar(word)
  }

  const words = data?.keys ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-red-500 mb-2">{t('common:loadFailed')}</div>
        <button
          onClick={() => refetch()}
          className="text-sm text-text-muted hover:text-text-primary underline"
        >
          {t('common:retry')}
        </button>
      </div>
    )
  }

  const filteredWords = words.filter((word) =>
    word.toLowerCase().includes(filterKey.toLowerCase())
  )

  if (filteredWords.length === 0) {
    return (
      <div className={clsx("text-[1.2em] font-light italic text-text-muted text-center p-2.5")}>
        {words.length === 0 ? t('popup:noWordsStarred') : t('popup:noMatchingWords')}
      </div>
    )
  }

  return (
    <div className={clsx("mt-5 w-full max-h-[500px] overflow-y-auto")}>
      {filteredWords.map((word) => (
        <WordItem
          key={word}
          word={word}
          onUnstar={handleUnstar}
          isUnstarring={unstarringWord === word}
        />
      ))}
    </div>
  )
}

function Index() {
  const { t } = useTranslation('popup')
  const [filterKey, setFilterKey] = useState('')
  const [settings] = useSettings()

  useEffect(() => {
    if (settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.theme])

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(chrome.runtime.getURL('options.html'))
    }
  }

  return (
    <div
      className={clsx(
        "box-border flex flex-col p-4 w-[300px]",
        "bg-surface text-text-primary transition-colors duration-300"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <input
          className={clsx(
            "text-[1.2em] border border-border bg-input text-text-primary rounded h-8 box-border px-2.5 flex-grow",
            "focus:outline-none focus:border-border-highlight",
            "placeholder:text-text-muted/50"
          )}
          type="input"
          placeholder={t('searchPlaceholder')}
          onChange={(event) => {
            setFilterKey(event.target.value)
          }}
          value={filterKey}></input>

        <button
          onClick={openOptions}
          className="p-1 rounded hover:bg-main/50 transition-colors text-text-muted hover:text-text-primary"
          title={t('settings')}
        >
          <SettingsIcon size={20} />
        </button>
      </div>
      <div>
        <WordListComponent filterKey={filterKey} />
      </div>
    </div>
  )
}

export default Index
