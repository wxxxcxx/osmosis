import type { VaultProvider, WordItem } from "./types"
import { ChromeSyncProvider } from "./providers/chrome-sync"
import { LocalStorageProvider } from "./providers/local"
import { storage as settingsStorage, defaultSettings, type VaultProviderType, STORAGE_KEY } from "~utils/settings"

/**
 * 单词本服务
 * 
 * 管理用户的生词本，支持同步存储。
 */
export class VaultService {
    private syncProvider = new ChromeSyncProvider()
    private localProvider = new LocalStorageProvider()

    /**
     * 获取当前激活的 Provider
     */
    private async getProvider(): Promise<VaultProvider> {
        // 读取设置
        const settings = await settingsStorage.getItem<any>(STORAGE_KEY)
        const type: VaultProviderType = settings?.vaultProvider || defaultSettings.vaultProvider
        
        return type === "local" ? this.localProvider : this.syncProvider
    }

    /**
     * 获取单词本中的所有单词
     */
    async getWords(): Promise<WordItem[]> {
        const provider = await this.getProvider()
        const map = await provider.getAll()
        // 转换为数组并按时间倒序排列
        return Object.values(map).sort((a, b) => b.createdAt - a.createdAt)
    }

    /**
     * 获取单词映射表 (key: word, value: WordItem)
     * 适合用于快速查找 O(1)
     */
    async getWordMap(): Promise<Record<string, WordItem>> {
        const provider = await this.getProvider()
        return await provider.getAll()
    }

    /**
     * 添加单词到生词本
     * @param word 单词文本
     */
    async addWord(word: string): Promise<void> {
        if (!word) return
        const normalized = word.toLowerCase().trim()
        const provider = await this.getProvider()
        await provider.add(normalized)
    }

    /**
     * 从生词本移除单词
     * @param word 单词文本
     */
    async removeWord(word: string): Promise<void> {
        if (!word) return
        const normalized = word.toLowerCase().trim()
        const provider = await this.getProvider()
        await provider.remove(normalized)
    }

    /**
     * 检查单词是否在生词本中
     */
    async hasWord(word: string): Promise<boolean> {
        if (!word) return false
        const normalized = word.toLowerCase().trim()
        const provider = await this.getProvider()
        return await provider.has(normalized)
    }

    /**
     * 清空生词本
     */
    async clear(): Promise<void> {
        const provider = await this.getProvider()
        await provider.clear()
    }

    /**
     * 获取存储统计信息
     */
    async getStorageStats() {
        const provider = await this.getProvider()
        return await provider.getStats()
    }
}

// 导出单例实例
export const vaultService = new VaultService()
