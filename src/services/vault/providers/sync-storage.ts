import { Storage } from "@plasmohq/storage"
import type { VaultProvider, WordItem } from "../types"
import { getByteSize, RateLimiter, hashString, serializeBucket, deserializeBucket } from "../utils"

// 常量定义
const CHUNK_PREFIX = "vault_"
const BUCKET_COUNT = 16 // 固定 16 个分桶
const MAX_BYTES_PER_ITEM = 7000

type ChunkData = Record<string, number>

export class SyncStorageProvider implements VaultProvider {
    private limiter = new RateLimiter()
    private storage = new Storage({
        area: "sync"
    })

    /**
     * 根据单词计算所属的 Bucket Key
     */
    private getBucketKey(word: string): string {
        const hash = hashString(word)
        const index = hash % BUCKET_COUNT
        return `${CHUNK_PREFIX}${index}`
    }

    /**
     * 获取所有分桶的 Key 列表
     */
    private getAllBucketKeys(): string[] {
        return Array.from({ length: BUCKET_COUNT }, (_, i) => `${CHUNK_PREFIX}${i}`)
    }

    async getAll(): Promise<Record<string, WordItem>> {
        const keys = this.getAllBucketKeys()

        // 并行读取所有 chunk (字符串)
        const rawChunks = await Promise.all(
            keys.map(key => this.storage.getItem<string>(key))
        )

        const result: Record<string, WordItem> = {}

        rawChunks.forEach((rawChunk) => {
            const chunk = deserializeBucket(rawChunk || "")
            Object.entries(chunk).forEach(([word, createdAt]) => {
                result[word] = { word, createdAt }
            })
        })

        return result
    }

    async has(word: string): Promise<boolean> {
        // O(1) 查询
        const key = this.getBucketKey(word)
        const rawChunk = await this.storage.getItem<string>(key)
        const chunk = deserializeBucket(rawChunk || "")
        return !!chunk[word]
    }

    async add(word: string): Promise<void> {
        await this.limiter.wait()

        const key = this.getBucketKey(word)
        const rawChunk = await this.storage.getItem<string>(key)
        const chunk = deserializeBucket(rawChunk || "")

        if (chunk[word]) return

        chunk[word] = Date.now()

        // 序列化
        const serialized = serializeBucket(chunk)

        // 检查大小
        // getByteSize 现在直接计算字符串的字节数
        if (getByteSize(serialized) > MAX_BYTES_PER_ITEM) {
            throw new Error(`Sync Storage bucket full (Hash collision overload).`)
        }

        try {
            await this.storage.setItem(key, serialized)
        } catch (e: any) {
            if (e.message?.includes("QUOTA_BYTES")) {
                throw new Error("Storage quota exceeded: Total bytes limit reached.")
            }
            throw e
        }
    }

    async remove(word: string): Promise<void> {
        await this.limiter.wait()

        const key = this.getBucketKey(word)
        const rawChunk = await this.storage.getItem<string>(key)

        if (!rawChunk) return

        const chunk = deserializeBucket(rawChunk)

        if (chunk[word]) {
            delete chunk[word]

            if (Object.keys(chunk).length === 0) {
                await this.storage.removeItem(key)
            } else {
                // 重新序列化并保存
                await this.storage.setItem(key, serializeBucket(chunk))
            }
        }
    }

    async clear(): Promise<void> {
        const keys = this.getAllBucketKeys()
        await Promise.all(keys.map(key => this.storage.removeItem(key)))
    }

    async getStats() {
        const keys = this.getAllBucketKeys()
        let bytesUsed = 0
        let itemsCount = 0

        const rawChunks = await Promise.all(
            keys.map(key => this.storage.getItem<string>(key))
        )

        rawChunks.forEach(rawChunk => {
            if (rawChunk) {
                bytesUsed += getByteSize(rawChunk)
                const chunk = deserializeBucket(rawChunk)
                itemsCount += Object.keys(chunk).length
            }
        })

        return {
            bytesUsed,
            itemsCount,
            chunkCount: BUCKET_COUNT
        }
    }
}
