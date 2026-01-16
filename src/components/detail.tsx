import { clsx } from "clsx"
import { Star } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
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
        <motion.button
          className={clsx(
            "p-1.5 rounded-full",
            "hover:bg-main/50",
            "focus:outline-none focus:ring-2 focus:ring-border-highlight/50",
            isLoading && "cursor-wait"
          )}
          onClick={handleToggleStar}
          title={isStarred ? t('unstar') : t('star')}
          disabled={isLoading}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isStarred ? "starred" : "unstarred"}
              initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
              animate={{
                scale: isLoading ? [1, 1.2, 1] : 1,
                rotate: 0,
                opacity: isLoading ? 0.5 : 1
              }}
              exit={{ scale: 0.5, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                scale: isLoading ? {
                  repeat: Infinity,
                  duration: 0.6,
                  ease: "easeInOut"
                } : undefined
              }}
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
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 mb-2 overflow-hidden"
          >
            {t('common:operationFailed')}
          </motion.div>
        )}
      </AnimatePresence>

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
                <span className="text-xs font-medium text-main">
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
