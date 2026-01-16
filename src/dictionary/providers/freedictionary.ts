import type { DictionaryProvider, DictionaryResult, Meaning, Definition, Phonetic } from '../types'

/**
 * Free Dictionary API 响应类型定义
 */
interface FreeDictionaryPhonetic {
    text?: string
    audio?: string
}

interface FreeDictionaryDefinition {
    definition: string
    example?: string
    synonyms?: string[]
    antonyms?: string[]
}

interface FreeDictionaryMeaning {
    partOfSpeech: string
    definitions: FreeDictionaryDefinition[]
    synonyms?: string[]
    antonyms?: string[]
}

interface FreeDictionaryEntry {
    word: string
    phonetic?: string
    phonetics?: FreeDictionaryPhonetic[]
    origin?: string
    meanings: FreeDictionaryMeaning[]
}

/**
 * Free Dictionary API 提供者
 * 
 * 使用 https://dictionaryapi.dev/ 免费 API 查询英语单词释义
 * 
 * 特点：
 * - 完全免费，无需 API Key
 * - 包含音标、发音音频、例句、同义词、反义词
 * - 支持多种语言（默认英语）
 */
export class FreeDictionary implements DictionaryProvider {
    readonly name = 'freedictionary'

    private readonly baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries'
    private readonly language = 'en'

    async query(word: string): Promise<DictionaryResult> {
        const url = `${this.baseUrl}/${this.language}/${encodeURIComponent(word)}`

        const response = await fetch(url)

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`未找到单词 "${word}" 的释义`)
            }
            throw new Error(`Free Dictionary API 请求失败: ${response.statusText}`)
        }

        const data: FreeDictionaryEntry[] = await response.json()
        return this.parseResponse(word, data)
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${this.language}/test`)
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * 解析 Free Dictionary API 响应
     */
    private parseResponse(word: string, data: FreeDictionaryEntry[]): DictionaryResult {
        if (!data || data.length === 0) {
            throw new Error(`未找到单词 "${word}" 的释义`)
        }

        const entry = data[0]

        // 转换音标列表
        const phonetics: Phonetic[] | undefined = entry.phonetics?.map(p => ({
            text: p.text,
            audio: p.audio
        }))

        // 转换 meanings
        const meanings: Meaning[] = entry.meanings.map(meaning => ({
            partOfSpeech: meaning.partOfSpeech,
            definitions: meaning.definitions.map(def => this.convertDefinition(def)),
            synonyms: meaning.synonyms,
            antonyms: meaning.antonyms
        }))

        if (meanings.length === 0) {
            throw new Error(`未找到单词 "${word}" 的释义`)
        }

        return {
            word: entry.word || word,
            meanings,
            phonetic: entry.phonetic || this.extractPhonetic(entry),
            phonetics,
            origin: entry.origin,
            source: this.name
        }
    }

    /**
     * 转换单个释义
     */
    private convertDefinition(def: FreeDictionaryDefinition): Definition {
        return {
            definition: def.definition,
            example: def.example,
            synonyms: def.synonyms && def.synonyms.length > 0 ? def.synonyms : undefined,
            antonyms: def.antonyms && def.antonyms.length > 0 ? def.antonyms : undefined
        }
    }

    /**
     * 提取音标（优先选择有音频的）
     */
    private extractPhonetic(entry: FreeDictionaryEntry): string | undefined {
        if (entry.phonetics && entry.phonetics.length > 0) {
            // 优先选择有音频的音标
            const withAudio = entry.phonetics.find(p => p.audio && p.text)
            if (withAudio?.text) {
                return withAudio.text
            }

            // 否则选择第一个有 text 的
            const withText = entry.phonetics.find(p => p.text)
            if (withText?.text) {
                return withText.text
            }
        }

        return undefined
    }
}

