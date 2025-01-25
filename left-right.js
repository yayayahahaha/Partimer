import rb from 'robotjs'
import { beforeStart } from './utils/others.js'

let way = 0
async function start() {
  await beforeStart(3)

  for (let i = 0; i < 1000; i++) {
    way++

    if (way % 2) rb.keyTap('left')
    else rb.keyTap('right')
    for (let j = 0; j < 16; j++) {
      rb.keyTap(j % 2 ? 'f' : 'd')
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

start()
