/**
 * 音标信息
 */
export interface Phonetic {
    /** 音标文本 */
    text?: string
    /** 发音音频 URL */
    audio?: string
}

/**
 * 单个释义
 */
export interface Definition {
    /** 释义内容 */
    definition: string
    /** 例句 */
    example?: string
    /** 同义词 */
    synonyms?: string[]
    /** 反义词 */
    antonyms?: string[]
}

/**
 * 单个词义（按词性分组）
 */
export interface Meaning {
    /** 词性（如 noun, verb, adjective 等） */
    partOfSpeech: string
    /** 该词性下的释义列表 */
    definitions: Definition[]
    /** 该词性的同义词 */
    synonyms?: string[]
    /** 该词性的反义词 */
    antonyms?: string[]
}

/**
 * 词典查询结果
 */
export interface DictionaryQueryResult {
    /** 查询的单词 */
    word: string
    /** 按词性分组的释义列表 */
    meanings: Meaning[]
    /** 主音标（简化版） */
    phonetic?: string
    /** 音标列表（包含多个发音） */
    phonetics?: Phonetic[]
    /** 词源 */
    origin?: string
    /** 词典来源 */
    source: string
}

/**
 * 词典提供者接口
 * 
 * 所有词典实现都需要实现此接口
 */
export interface DictionaryProvider {
    /** 词典名称 */
    readonly name: string

    /**
     * 查询单词释义
     * 
     * @param word - 要查询的单词（已经过预处理：小写、去空格）
     * @returns 查询结果
     * @throws Error 如果查询失败
     */
    query(word: string): Promise<DictionaryQueryResult>

    /**
     * 检查词典是否可用
     * 
     * @returns 是否可用
     */
    isAvailable(): Promise<boolean>
}

/**
 * 词典查询选项
 */
export interface DictionaryQueryOptions {
    /** 是否使用缓存，默认 true */
    useCache?: boolean
    /** 是否保存到缓存，默认 true */
    saveCache?: boolean
}


