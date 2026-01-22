import type { PlasmoMessaging } from '@plasmohq/messaging'
import { Storage } from '@plasmohq/storage'

import { dictionaryService } from '~dictionary'
import * as utils from '~utils/word'

const syncStorage = new Storage({
  area: 'sync'
})

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
  await new Promise((resolve) => setTimeout(resolve, 1000))
  let queryKey = request.body.key

  try {
    checkWord(queryKey)
    queryKey = queryKey.toLowerCase()

    // 使用词典服务查询
    const result = await dictionaryService.query(queryKey)

    // 检查是否已收藏
    const key = `word.${queryKey}`
    const starred = (await syncStorage.getItem(key)) != null

    response.send({
      code: 0,
      key: queryKey,
      starred: starred,
      meanings: result.meanings,
      phonetic: result.phonetic,
      source: result.source
    })
  } catch (ex) {
    response.send({
      code: 1,
      key: queryKey,
      message: ex.message
    })
  }
}

export default handler

