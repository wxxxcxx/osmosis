import { clsx } from "clsx"
import { Star } from "lucide-react"
import React, { useState } from 'react'

import { sendToBackground } from '@plasmohq/messaging'

import { useMutation } from '~hooks/use-query'
import type { Meaning, Phonetic } from '~dictionary'
import marker from '~contents/marker'
import { useTranslation } from '~utils/i18n'

interface WordCardProps {
  text: string
  data: {
    code: number
    meanings: Meaning[]
    starred: boolean
    message: string | null
    phonetic?: string
    phonetics?: Phonetic[]
    origin?: string
  }
}

const Detail: React.FC<WordCardProps> = ({ text, data }) => {
  const { t } = useTranslation(['detail', 'common'])
  const [isStarred, setIsStarred] = useState(data.starred)

  // 内联使用 useMutation 处理收藏/取消收藏
  const { mutate: toggleStar, isLoading, error } = useMutation<
    { code: number; message: string | null },
    "star" | "unstar"
  >(
    async (action) => {
      return await sendToBackground({
        name: action,
        body: { key: text }
      } as any)
    },
    {
      onSuccess: (response, action) => {
        if (response.code === 0) {
          setIsStarred(action === "star")
          marker.renderer.render()

          // 如果是收藏操作，清除页面选区
          // 这样可以避免选区残留导致的 UI 状态矛盾
          if (action === "star") {
            window.getSelection()?.removeAllRanges()
          }
        } else {
          console.error("Osmosis: Star mutation failed:", response.message)
        }
      },
      onError: (err) => {
        console.error("Osmosis: Star mutation error:", err)
      }
    }
  )

  const handleToggleStar = async () => {
    if (isLoading) return
    await toggleStar(isStarred ? "unstar" : "star")
  }

  // 检查是否有释义
  const hasMeanings = data.meanings && data.meanings.length > 0

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full max-w-full">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-2 border-b border-border">
        <div className="flex flex-col">
          <div className="text-xl font-bold text-text-primary break-words">
            {text}
          </div>
          {data.phonetic && (
            <div className="text-xs text-text-muted mt-0.5">
              /{data.phonetic}/
            </div>
          )}
        </div>
        <button
          className={clsx(
            "p-1.5 rounded-full",
            "hover:bg-main/50 transition-all duration-200",
            "hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-border-highlight/50",
            isLoading && "cursor-wait"
          )}
          onClick={handleToggleStar}
          title={isStarred ? t('unstar') : t('star')}
          disabled={isLoading}
        >
          <div
            key={isStarred ? "starred" : "unstarred"}
            className={clsx(
              "transition-all duration-300 transform",
              isLoading ? "animate-pulse opacity-50 scale-110" : "scale-100 opacity-100",
              // 简单稳定的进入动画
              "animate-in fade-in zoom-in-50 duration-300"
            )}
          >
            <Star
              size={20}
              className={clsx(
                "transition-colors duration-300",
                isStarred
                  ? "fill-star-fill text-star-text"
                  : "text-text-muted hover:text-text-primary"
              )}
            />
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="text-xs text-red-500 mb-2 overflow-hidden animate-in slide-in-from-top-1 fade-in duration-200"
        >
          {t('common:operationFailed')}
        </div>
      )}

      {/* Content - Scrollable */}
      <div className={clsx(
        "flex flex-1 min-h-0 flex-col gap-3 pr-1",
        "overflow-y-auto overflow-x-hidden scrollbar-thin",
        "scrollbar-thumb-border scrollbar-track-transparent"
      )}>
        {hasMeanings ? (
          data.meanings.map((meaning, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              {/* 词性标签 */}
              {meaning.partOfSpeech && (
                <span className="text-xs font-medium text-text-muted">
                  {meaning.partOfSpeech}
                </span>
              )}
              {/* 该词性下的释义列表 */}
              <div className="flex flex-col gap-2 pl-2">
                {meaning.definitions.map((def, defIdx) => (
                  <div key={defIdx} className="flex flex-col gap-0.5">
                    <div className="text-sm leading-relaxed text-text-muted">
                      {meaning.definitions.length > 1 && (
                        <span className="text-text-muted/50 mr-1">{defIdx + 1}.</span>
                      )}
                      {def.definition}
                    </div>
                    {def.example && (
                      <div className="text-xs text-text-muted/70 italic pl-3">
                        {t('common:example')} {def.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm italic text-text-muted/70">
            {t('common:noDefinitions')}
          </div>
        )}
      </div>
    </div>
  )
}

export default Detail
