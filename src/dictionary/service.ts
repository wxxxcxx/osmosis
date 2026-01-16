import { Storage } from '@plasmohq/storage'

import type { DictionaryProvider, DictionaryResult, DictionaryQueryOptions } from './types'
import { YoudaoDictionary, FreeDictionary } from './providers'
import * as wordUtils from '../utils/word'

/**
 * 词典服务
 * 
 * 统一管理词典查询，支持缓存和多词典切换
 */
export class DictionaryService {
    private providers: Map<string, DictionaryProvider> = new Map()
    private defaultProvider: string = 'freedictionary'
    private localStorage: Storage

    constructor() {
        this.localStorage = new Storage({ area: 'local' })

        // 注册词典提供者
        this.registerProvider(new FreeDictionary())
        this.registerProvider(new YoudaoDictionary())
    }

    /**
     * 注册词典提供者
     */
    registerProvider(provider: DictionaryProvider): void {
        this.providers.set(provider.name, provider)
    }

    /**
     * 设置默认词典
     */
    setDefaultProvider(name: string): void {
        if (!this.providers.has(name)) {
            throw new Error(`词典 "${name}" 未注册`)
        }
        this.defaultProvider = name
    }

    /**
     * 获取所有已注册的词典名称
     */
    getProviderNames(): string[] {
        return Array.from(this.providers.keys())
    }

    /**
     * 查询单词
     * 
     * @param word - 要查询的单词
     * @param options - 查询选项
     * @param providerName - 指定使用的词典（可选，默认使用 defaultProvider）
     */
    async query(
        word: string,
        options: DictionaryQueryOptions = {},
        providerName?: string
    ): Promise<DictionaryResult> {
        const { useCache = true, saveCache = true } = options

        // 预处理单词
        const normalizedWord = this.normalizeWord(word)

        // 尝试从缓存获取
        if (useCache) {
            const cached = await this.getFromCache(normalizedWord)
            if (cached) {
                console.log(`[Dictionary] 从缓存获取: ${normalizedWord}`)
                return cached
            }
        }

        // 从词典查询
        const provider = this.getProvider(providerName)
        console.log(`[Dictionary] 从 ${provider.name} 查询: ${normalizedWord}`)

        const result = await provider.query(normalizedWord)

        // 保存到缓存
        if (saveCache) {
            await this.saveToCache(normalizedWord, result)
        }

        return result
    }

    /**
     * 预处理单词
     */
    private normalizeWord(word: string): string {
        if (!word) {
            throw new Error('未提供单词')
        }
        if (!wordUtils.isEnglishWord(word)) {
            throw new Error(`不是有效的英语单词: ${word}`)
        }
        return word.trim().toLowerCase()
    }

    /**
     * 获取词典提供者
     */
    private getProvider(name?: string): DictionaryProvider {
        const providerName = name || this.defaultProvider
        const provider = this.providers.get(providerName)
        if (!provider) {
            throw new Error(`词典 "${providerName}" 未注册`)
        }
        return provider
    }

    /**
     * 从缓存获取
     */
    private async getFromCache(word: string): Promise<DictionaryResult | null> {
        const cacheKey = this.getCacheKey(word)
        const cached = await this.localStorage.getItem<DictionaryResult>(cacheKey)
        return cached || null
    }

    /**
     * 保存到缓存
     */
    private async saveToCache(word: string, result: DictionaryResult): Promise<void> {
        const cacheKey = this.getCacheKey(word)
        await this.localStorage.setItem(cacheKey, result)
    }

    /**
     * 生成缓存键
     */
    private getCacheKey(word: string): string {
        return `cache.dictionary.${word}`
    }

    /**
     * 清除单词缓存
     */
    async clearCache(word: string): Promise<void> {
        const normalizedWord = this.normalizeWord(word)
        const cacheKey = this.getCacheKey(normalizedWord)
        await this.localStorage.removeItem(cacheKey)
    }
}

// 导出单例实例
export const dictionaryService = new DictionaryService()
