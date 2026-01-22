import type { DictionaryProvider, DictionaryQueryResult, Meaning, Definition } from '../types'

/**
 * 有道词典提供者
 * 
 * 使用有道词典 API 查询英语单词释义
 */
export class YoudaoDictionary implements DictionaryProvider {
    readonly name = 'youdao'

    private readonly baseUrl = 'https://dict.youdao.com/jsonapi'

    async query(word: string): Promise<DictionaryQueryResult> {
        const url = new URL(this.baseUrl)
        url.searchParams.set('jsonversion', '2')
        url.searchParams.set('dicts', JSON.stringify({ count: 99, dicts: [['ec', 'ce']] }))
        url.searchParams.set('q', word)

        const response = await fetch(url.toString())
        if (!response.ok) {
            throw new Error(`有道词典请求失败: ${response.statusText}`)
        }

        const data = await response.json()
        return this.parseResponse(word, data)
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(this.baseUrl, { method: 'HEAD' })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * 解析有道词典 API 响应
     * 
     * 有道 API 返回格式示例:
     * trs: [{ pos: "n.", tr: [{ l: { i: ["释义1"] } }] }, ...]
     */
    private parseResponse(word: string, data: any): DictionaryQueryResult {
        const wordData = data?.ec?.word?.[0]

        if (!wordData || !wordData.trs || wordData.trs.length === 0) {
            throw new Error(`未找到单词 "${word}" 的释义`)
        }

        // 按词性分组释义
        const meaningMap = new Map<string, Definition[]>()

        for (const tr of wordData.trs) {
            // 提取词性，默认为空字符串（未知词性）
            const pos = tr?.pos || ''
            const definitionText = tr?.tr?.[0]?.l?.i?.[0]

            if (definitionText) {
                if (!meaningMap.has(pos)) {
                    meaningMap.set(pos, [])
                }
                // 转换为 Definition 对象
                meaningMap.get(pos)!.push({
                    definition: definitionText
                })
            }
        }

        if (meaningMap.size === 0) {
            throw new Error(`未找到单词 "${word}" 的释义`)
        }

        // 转换为 Meaning 数组
        const meanings: Meaning[] = Array.from(meaningMap.entries()).map(([partOfSpeech, definitions]) => ({
            partOfSpeech,
            definitions
        }))

        // 提取音标（如果有）
        const phonetic = wordData.phone || wordData.ukphone || wordData.usphone

        return {
            word,
            meanings,
            phonetic,
            source: this.name
        }
    }
}


