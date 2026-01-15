import { useEffect, useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"

export interface WordData {
    code: number
    definitions: string[]
    starred: boolean
    message: string | null
}

export interface UseWordDataResult {
    /** 单词数据 */
    wordData: WordData | null
    /** 是否正在加载 */
    loading: boolean
}

/**
 * 获取单词的详细数据
 * 
 * 当 wordKey 变化时，自动从后台获取单词的释义和状态
 * 
 * @param wordKey - 单词的 key（小写形式）
 */
export function useWordData(wordKey: string | undefined): UseWordDataResult {
    const [wordData, setWordData] = useState<WordData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!wordKey) {
            setWordData(null)
            setLoading(false)
            return
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                const response = await sendToBackground({
                    name: 'query',
                    body: { key: wordKey }
                })
                setWordData(response)
            } catch (error) {
                console.error("Osmosis: Failed to fetch word data", error)
                setWordData({
                    code: -1,
                    definitions: [],
                    starred: false,
                    message: "Failed to fetch word data"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [wordKey])

    return {
        wordData,
        loading
    }
}
