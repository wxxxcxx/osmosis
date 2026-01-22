export interface WordItem {
    /** 单词本身（作为唯一 ID） */
    word: string
    /** 添加时间戳 */
    createdAt: number
    /** 标签（可选，为未来预留） */
    tags?: string[]
}

/**
 * 存储提供者接口
 */
export interface VaultProvider {
    /** 获取所有单词 */
    getAll(): Promise<Record<string, WordItem>>
    
    /** 添加或更新单词 */
    add(word: string): Promise<void>
    
    /** 移除单词 */
    remove(word: string): Promise<void>
    
    /** 检查单词是否存在 */
    has(word: string): Promise<boolean>
    
    /** 清空所有数据 */
    clear(): Promise<void>

    /** 获取存储使用情况统计 */
    getStats(): Promise<{
        bytesUsed: number
        itemsCount: number
        chunkCount: number
    }>
}
