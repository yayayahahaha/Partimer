import { beforeStart, displayMousePosition } from './utils/others.js'
import { extract, market, money } from './utils/money-utils.js'
import { redRobot, spring2 } from './utils/thunder.js'
import select from '@inquirer/select'

async function start() {
  const selectAnswer = await select({
    message: '想做什麼呢',
    choices: [
      {
        name: '奧迪溫-左右',
        value: '奧迪溫-左右',
      },
      {
        name: '桃源境',
        value: '桃源境',
      },
      {
        name: 'money',
        value: 'money',
      },
      {
        name: 'money start with market',
        value: 'money-start-with-market',
      },
      {
        name: 'market',
        value: 'market',
      },
      {
        name: 'extract',
        value: 'extract',
      },

      {
        name: 'coordinate 顯示座標',
        value: '顯示座標',
      },
    ],
  }).catch(() => null)
  if (selectAnswer == null) return void console.log('使用者取消')
  console.log(`選了: ${selectAnswer}`)

  await beforeStart(3)
  switch (selectAnswer) {
    case '奧迪溫-左右':
      redRobot(true)
      break

    case '桃源境':
      spring2()
      break

    case 'money':
      money()
      break

    case 'money-start-with-market':
      money({ startWith: 'market' })
      break

    case 'market':
      market()
      break

    case 'extract':
      extract()
      break

    case '顯示座標':
      displayMousePosition()
      break
  }
}
start()
