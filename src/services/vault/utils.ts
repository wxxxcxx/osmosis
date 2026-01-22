/**
 * 计算对象序列化后的字节大小 (UTF-8)
 */
export function getByteSize(obj: any): number {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj)
    // 使用 Blob 计算 UTF-8 字节大小
    return new Blob([str]).size
}

/**
 * 简单的内存防抖锁，防止短时间内频繁写入
 * Chrome Sync 限制：每分钟 120 次操作
 */
export class RateLimiter {
    private lastCall = 0
    private minInterval = 500 // 500ms 最小间隔

    async wait(): Promise<void> {
        const now = Date.now()
        const diff = now - this.lastCall
        if (diff < this.minInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minInterval - diff))
        }
        this.lastCall = Date.now()
    }
}

/**
 * 字符串 Hash 算法 (DJB2)
 * 返回正整数
 */
export function hashString(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
    }
    return hash >>> 0 // 确保非负
}

// 压缩相关配置
const BASE_TIMESTAMP = 1704067200000 // 2024-01-01 00:00:00 UTC
const SEPARATOR_ITEM = "|"
const SEPARATOR_KV = ":"

/**
 * 将 Bucket 对象序列化为紧凑字符串
 * 格式: word:time36|word:time36
 */
export function serializeBucket(data: Record<string, number>): string {
    return Object.entries(data)
        .map(([word, timestamp]) => {
            // 转为相对于基准时间的分钟数
            const diff = Math.max(0, Math.floor((timestamp - BASE_TIMESTAMP) / 60000))
            // Base36 编码
            const timeStr = diff.toString(36)
            return `${word}${SEPARATOR_KV}${timeStr}`
        })
        .join(SEPARATOR_ITEM)
}

/**
 * 将紧凑字符串反序列化为 Bucket 对象
 */
export function deserializeBucket(str: string): Record<string, number> {
    if (!str) return {}
    
    const result: Record<string, number> = {}
    const items = str.split(SEPARATOR_ITEM)
    
    for (const item of items) {
        const [word, timeStr] = item.split(SEPARATOR_KV)
        if (word && timeStr) {
            // Base36 解码并恢复为毫秒级时间戳 (精度损失为分钟级)
            const diff = parseInt(timeStr, 36)
            const timestamp = BASE_TIMESTAMP + (diff * 60000)
            result[word] = timestamp
        }
    }
    return result
}
