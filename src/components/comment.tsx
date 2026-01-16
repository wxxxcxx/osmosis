import { clsx } from "clsx"
import React, { useMemo } from 'react'
import { useWordData } from "~hooks/use-word-data"
import { useSettings } from "~utils/settings"
import Marquee from "./ui/marquee"

interface CommentProps {
    wordKey: string
}

export const Comment: React.FC<CommentProps> = ({ wordKey }) => {
    const [settings] = useSettings()
    const { wordData, loading } = useWordData(wordKey)

    // 获取第一个释义
    const firstDefinition = useMemo(() => {
        if (!wordData || !wordData.meanings || wordData.meanings.length === 0) return null
        const firstMeaning = wordData.meanings[0]
        if (!firstMeaning.definitions || firstMeaning.definitions.length === 0) return null
        return firstMeaning.definitions[0].definition
    }, [wordData])

    if (!settings?.showComment || loading || !firstDefinition) {
        return null
    }

    return (
        <span
            className={clsx(
                "comment-container",
                "absolute -top-[0.7em] left-0 w-full rounded-sm",
                "text-[0.6em] leading-[1em] select-none",
                "overflow-hidden block",
                "select-none"
            )}
            style={{
                backgroundColor: settings.commentBgColor,
                color: settings.commentTextColor
            }}
        >
            <Marquee
                className="w-full"
                speed={10}
            >
                <div className="whitespace-nowrap px-1">
                    {firstDefinition}
                </div>
            </Marquee>
        </span>
    )
}

export default Comment
