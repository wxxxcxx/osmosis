import type { PlasmoMessaging } from '@plasmohq/messaging'
import { Storage } from '@plasmohq/storage'

import * as utils from '../../utils/word'

const syncStorage = new Storage({
  area: 'sync'
})

const localStorage = new Storage({
  area: 'local'
})

const queryFromCache = async (queryKey: string) => {
  if (!queryKey) {
    throw new Error(`No word provided`)
  }
  if (!utils.isEnglishWord(queryKey)) {
    throw new Error(`Not a English word: ${queryKey}`)
  }
  queryKey = queryKey.trim()
  queryKey = queryKey.toLowerCase()
  const cacheKey = `cache.definition.${queryKey}`
  const value = await localStorage.getItem<string[]>(cacheKey)
  if (value) {
    console.log(`Found word ${queryKey} in cache: ${cacheKey}`)
    return value
  }
}

const saveToCache = async (queryKey: string, definitions: string[]) => {
  if (!queryKey) {
    throw new Error(`No word provided`)
  }
  if (!utils.isEnglishWord(queryKey)) {
    throw new Error(`Not a English word: ${queryKey}`)
  }
  queryKey = queryKey.trim()
  queryKey = queryKey.toLowerCase()
  const cacheKey = `cache.definition.${queryKey}`
  await localStorage.setItem(cacheKey, definitions)
}

export const query = async (queryKey: string) => {
  if (!queryKey) {
    throw new Error(`No word provided`)
  }
  if (!utils.isEnglishWord(queryKey)) {
    throw new Error(`Not a English word: ${queryKey}`)
  }
  queryKey = queryKey.trim()
  queryKey = queryKey.toLowerCase()
  let definitions = await queryFromCache(queryKey)
  if (definitions) {
    return definitions
  }
  console.log(`Querying word ${queryKey} from youdao`)
  const result = await fetch(
    `https://dict.youdao.com/jsonapi?jsonversion=2&dicts=%7B%22count%22%3A99%2C%22dicts%22%3A%5B%5B%22ec%22%2C%22ce%22%5D%5D%7D&q=${queryKey}`
  )
  if (!result.ok) {
    throw new Error(`Failed to fetch word ${queryKey}: ${result.statusText}`)
  }
  let data = await result.json()
  data = data?.ec?.word[0]
  if (!data || data['trs'].length === 0) {
    throw new Error(`Not found definition, response: ${JSON.stringify(data)}`)
  }
  definitions = []
  for (const tr of data['trs']) {
    const definition = tr?.tr[0]?.l?.i[0]
    if (!definition) {
      throw new Error(`Not found definition, response: ${JSON.stringify(data)}`)
    }
    definitions.push(definition)
  }
  await saveToCache(queryKey, definitions)
  return definitions
}

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
    const definitions = await query(queryKey)
    const key = `word.${queryKey}`
    const starred = (await syncStorage.getItem(key)) != null
    response.send({
      code: 0,
      key: queryKey,
      starred: starred,
      definitions: definitions
    })
  } catch (ex) {
    response.send({
      code: 1,
      key: queryKey,
      message: ex.message
    })
    return
  }
}

export default handler
