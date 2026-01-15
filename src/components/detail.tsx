import { clsx } from "clsx"
import { Star } from "lucide-react"
import React, { useState } from 'react'

import { sendToBackground } from '@plasmohq/messaging'

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
  const [loading, setLoading] = useState(false)

  const handleToggleStar = async () => {
    if (loading) return
    setLoading(true)

    const action = isStarred ? 'unstar' : 'star'

    try {
      const response = await sendToBackground({
        name: action,
        body: { key: text }
      })

      if (response.code != 0) {
        console.error(response.message)
        return
      }

      setIsStarred(!isStarred)
      // Trigger re-render of highlights on the page
      marker.renderer.render()
    } catch (error) {
      console.error("Osmosis: Failed to toggle star", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col w-full max-w-full">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 pb-2 mb-2 border-b border-border">
        <div className="text-xl font-bold text-text-primary break-words">
          {text}
        </div>
        <button
          className={clsx(
            "p-1.5 rounded-full transition-all duration-200",
            "hover:bg-main/50 active:scale-90",
            "focus:outline-none focus:ring-2 focus:ring-border-highlight/50",
            loading && "opacity-50 cursor-wait"
          )}
          onClick={handleToggleStar}
          title={isStarred ? "Unstar" : "Star"}
          disabled={loading}
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
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className={clsx(
        "flex flex-1 min-h-0 flex-col gap-2 pr-1", // 使用 flex-1 使其填满空间并触发滚动
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
