import { beforeStart, displayMousePosition } from './utils/others.js'
import { extract, market, money } from './utils/money-utils.js'
import { battleField, movie, redRobot } from './utils/thunder.js'
import select from '@inquirer/select'

async function start() {
  const selectAnswer = await select({
    message: '想做什麼呢',
    choices: [
      {
        name: '賽爾尼溫',
        value: '賽爾尼溫',
      },
      {
        name: '阿爾克斯',
        value: '阿爾克斯',
      },
      {
        name: '奧迪溫',
        value: '奧迪溫',
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
  })
  console.log(`選了: ${selectAnswer}`)

  await beforeStart(3)
  switch (selectAnswer) {
    case '賽爾尼溫':
      battleField()
      break

    case '阿爾克斯':
      movie()
      break

    case '奧迪溫':
      redRobot()
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
