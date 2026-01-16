import { clsx } from "clsx"
import { Star } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import React, { useState } from 'react'

import { sendToBackground } from '@plasmohq/messaging'

import { useMutation } from '~hooks/use-query'
import marker from '~contents/marker'

interface WordCardProps {
  text: string
  data: {
    code: number
    definitions: string[]
    starred: boolean
    message: string | null
  }
}

const Detail: React.FC<WordCardProps> = ({ text, data }) => {
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
      })
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

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full max-w-full">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-2 border-b border-border">
        <div className="text-xl font-bold text-text-primary break-words">
          {text}
        </div>
        <motion.button
          className={clsx(
            "p-1.5 rounded-full",
            "hover:bg-main/50",
            "focus:outline-none focus:ring-2 focus:ring-border-highlight/50",
            isLoading && "cursor-wait"
          )}
          onClick={handleToggleStar}
          title={isStarred ? "Unstar" : "Star"}
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
            操作失败，请重试
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - Scrollable */}
      <div className={clsx(
        "flex flex-1 min-h-0 flex-col gap-2 pr-1",
        "overflow-y-auto overflow-x-hidden scrollbar-thin",
        "scrollbar-thumb-border scrollbar-track-transparent"
      )}>
        {data.definitions && data.definitions.length > 0 ? (
          data.definitions.map((definition, index) => (
            <div
              key={index}
              className="text-sm leading-relaxed text-text-muted"
            >
              {definition}
            </div>
          ))
        ) : (
          <div className="text-sm italic text-text-muted/70">
            No definitions found.
          </div>
        )}
      </div>
    </div>
  )
}

export default Detail



