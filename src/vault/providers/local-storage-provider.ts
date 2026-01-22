import { Storage } from "@plasmohq/storage"
import type { VaultProvider, WordItem } from "../types"
import { getByteSize } from "../utils"

const LOCAL_KEY = "vault_local_data"

export class LocalStorageProvider implements VaultProvider {
    private storage = new Storage({
        area: "local"
    })

    async getAll(): Promise<Record<string, WordItem>> {
        const data = await this.storage.getItem<Record<string, number>>(LOCAL_KEY) || {}
        const result: Record<string, WordItem> = {}
        Object.entries(data).forEach(([word, createdAt]) => {
            result[word] = { word, createdAt }
        })
        return result
    }

    async has(word: string): Promise<boolean> {
        const all = await this.getAll()
        return !!all[word]
    }

    async add(word: string): Promise<void> {
        const data = await this.storage.getItem<Record<string, number>>(LOCAL_KEY) || {}
        data[word] = Date.now()
        await this.storage.setItem(LOCAL_KEY, data)
    }

    async remove(word: string): Promise<void> {
        const data = await this.storage.getItem<Record<string, number>>(LOCAL_KEY) || {}
        if (data[word]) {
            delete data[word]
            await this.storage.setItem(LOCAL_KEY, data)
        }
    }

    async clear(): Promise<void> {
        await this.storage.removeItem(LOCAL_KEY)
    }

    async getStats() {
        const data = await this.storage.getItem<Record<string, any>>(LOCAL_KEY) || {}
        const str = JSON.stringify(data)
        return {
            bytesUsed: getByteSize(str), // 使用通用 getByteSize 计算
            itemsCount: Object.keys(data).length,
            chunkCount: 1
        }
    }
}
