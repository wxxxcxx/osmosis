import type { PlasmoMessaging } from '@plasmohq/messaging'

import { dictionaryService } from '~dictionary'
import { vaultService } from '~vault'
import * as utils from '~utils/word'

function checkWord(word: string): boolean {
  if (!word) {
    throw new Error('未提供单词')
  }
  if (!utils.isEnglishWord(word)) {
    throw new Error(`不是有效的英语单词: ${word}`)
  }
  return true
}

const handler: PlasmoMessaging.MessageHandler = async (request, response) => {
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  let queryKey = request.body.key

  try {
    checkWord(queryKey)
    queryKey = queryKey.toLowerCase()

    // 使用词典服务查询
    // 注意：dictionaryService 和 vaultService 可以并行执行以优化性能
    const [result, starred] = await Promise.all([
        dictionaryService.query(queryKey),
        vaultService.hasWord(queryKey)
    ])

    response.send({
      code: 0,
      key: queryKey,
      starred: starred,
      meanings: result.meanings,
      phonetic: result.phonetic,
      source: result.source
    })
  } catch (ex: any) {
    response.send({
      code: 1,
      key: queryKey,
      message: ex.message
    })
  }
}

export default handler