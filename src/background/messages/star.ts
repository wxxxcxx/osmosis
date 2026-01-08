import { func } from 'prop-types'

import type { PlasmoMessaging } from '@plasmohq/messaging'
import { Storage } from '@plasmohq/storage'

import * as utils from '../../utils/word'

interface WordItem {
  timespan: number
}

const syncStorage = new Storage({
  area: 'sync'
})

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
  let queryKey = request.body.key
  try {
    checkWord(queryKey)
    queryKey = queryKey.toLowerCase()
    const key = `word.${queryKey}`
    const value = await syncStorage.getItem<WordItem>(key)
    if (!value) {
      await syncStorage.setItem(key, {
        timespan: Date.now()
      })
    }
    response.send({
      code: 0,
      word: queryKey
    })
  } catch (ex) {
    response.send({
      code: 1,
      word: queryKey,
      message: ex.message
    })
    return
  }
}

export default handler
