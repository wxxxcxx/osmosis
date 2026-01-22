import type { PlasmoMessaging } from '@plasmohq/messaging'
import { vaultService } from '~vault'

const handler: PlasmoMessaging.MessageHandler = async (_request, response) => {
  const words = await vaultService.getWords()
  const keys = words.map(item => item.word)
  response.send({
    code: 0,
    keys: keys
  })
}

export default handler