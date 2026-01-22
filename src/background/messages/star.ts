import type { PlasmoMessaging } from '@plasmohq/messaging'

import { vaultService } from '~services/vault'
import * as utils from '~utils/word'

function checkWord(word: string): boolean {
  if (!word) {
    throw new Error(`No word provided`)
  }
  if (!utils.isEnglishWord(word)) {
    throw new Error(`Not a English word: ${word}`)
  }
  return true
}

const handler: PlasmoMessaging.MessageHandler = async (request, response) => {
  // 模拟延迟是否还需要？如果不需要可以移除
  // await new Promise((resolve) => setTimeout(resolve, 1000))
  let queryKey = request.body.key
  try {
    checkWord(queryKey)
    queryKey = queryKey.toLowerCase()
    
    await vaultService.addWord(queryKey)
    
    response.send({
      code: 0,
      word: queryKey
    })
  } catch (ex: any) {
    response.send({
      code: 1,
      word: queryKey,
      message: ex.message
    })
  }
}

export default handler