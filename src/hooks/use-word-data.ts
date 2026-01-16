import { useQuery } from "./use-query"
import { sendToBackground } from "@plasmohq/messaging"
import type { Meaning, Phonetic } from "~dictionary"

export interface WordData {
    code: number
    meanings: Meaning[]
    starred: boolean
    message: string | null
    phonetic?: string
    phonetics?: Phonetic[]
    origin?: string
    source?: string
}

export interface UseWordDataResult {
    /** 单词数据 */
    wordData: WordData | null
    /** 是否正在加载 */
    loading: boolean
    /** 是否发生错误 */
    error: any
    /** 重新获取数据 */
    refetch: () => Promise<void>
}

/**
 * 获取单词的详细数据
 * 
 * 当 wordKey 变化时，自动从后台获取单词的释义和状态
 * 
 * @param wordKey - 单词的 key（小写形式）
 */
export function useWordData(wordKey: string | undefined): UseWordDataResult {
    const { data: wordData, isLoading: loading, error, refetch } = useQuery<WordData>(
        ["word-data", wordKey],
        async () => {
            if (!wordKey) return null
            return await sendToBackground({
                name: "query",
                body: { key: wordKey }
            })
        },
        {
            enabled: !!wordKey
        }
    )

    return {
        wordData,
        loading,
        error,
        refetch
    }
}
