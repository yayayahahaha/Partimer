// TODO(flyc)
// 每一個行為結束後，角色應該要在的位置是否正確 (from min-map)
// 如果畫面不是當前正在執行的地圖了，就要停掉的機制 (要用非同步 + flag才不會打斷)

import rb from 'robotjs'
import { delay, getApplicationInfo } from './others.js'

const buffBetweenEach = {
  coldTime: 3 * 1000,
  previousTimestamp: 0,
}
let buffList = null
function generateBuffList(allowBuffList = 'all') {
  const previousTimestamp = Date.now()
  return [
    {
      code: '2',
      coldTime: 120 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: '3',
      coldTime: 120 * 1000,
      priority: true,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: '4',
      coldTime: 240 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: 'home',
      coldTime: 180 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: 'end',
      coldTime: 120 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: 'delete',
      coldTime: 45 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: '5',
      coldTime: 63 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
    {
      code: 'n',
      coldTime: 250 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },

    {
      code: 'pagedown',
      coldTime: 60 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'stay-attack',
    },
    {
      code: '6',
      coldTime: 20 * 1000,
      priority: true,
      previousTimestamp,
      buffType: 'stay-attack',
    },
    {
      code: 'u',
      coldTime: 150 * 1000,
      priority: false,
      previousTimestamp,
      buffType: 'buff',
    },
  ].filter((buffInfo) => {
    if (allowBuffList === 'all') return true
    const { code, buffType } = buffInfo
    return allowBuffList.includes(buffType) || allowBuffList.includes(code)
  })
}

function buffStuff(buffType) {
  if (buffType === 'no') return

  const current = Date.now()
  if (buffList == null) buffList = generateBuffList(buffType)

  // 因為是放在攻擊之間，所以如果兩次放 buff 的間隔如果太近就直接跳掉，
  if (buffBetweenEach.previousTimestamp + buffBetweenEach.coldTime > current) return

  // 一次放幾個技能: 1 ~ 2
  let buffCount = randomNumber(2)

  // 有 priority 的放前面
  const list = buffList.sort(() => Math.random() - 0.5).sort((a) => (a.priority ? -1 : 1))

  // console.log('buff list: ', JSON.stringify(list.map((item) => item.code)))

  for (let i = 0; i < list.length; i++) {
    const buff = list[i]
    if (buff.previousTimestamp + buff.coldTime < current) {
      sleepWithRb(randomNumber(200, 100))

      // each between part
      buffBetweenEach.previousTimestamp = Date.now() + randomNumber(4000, 0)

      // buff part
      rb.setKeyboardDelay(randomNumber(1200, 1000))
      rb.keyTap(buff.code)

      // 隨機讓他更久一些
      buff.previousTimestamp = Date.now() + randomNumber(2000, 1000)

      buffCount--

      if (buffCount === 0) break
    }
  }
  rb.setKeyboardDelay(10)
}

const attackList = [
  {
    code: 'g',
    coldTime: 8 * 1000,
    beforeWaveDelay: 100,
    waveDelayTime: 150,
    previousTimestamp: null,
  },
  {
    code: 'a',
    coldTime: 13 * 1000,
    beforeWaveDelay: 100,
    waveDelayTime: 100,
    previousTimestamp: null,
  },
  {
    code: 'y',
    coldTime: 45 * 1000,
    beforeWaveDelay: 100,
    waveDelayTime: 120,
    previousTimestamp: null,
  },
]

function attack({ useDefault = false, afterDelay = null, buffType = 'all' } = {}) {
  // 攻擊前放 buff
  buffStuff(buffType)

  // 檢查是不是在該在的 application
  const { applicationTitle: oriTitle } = getApplicationInfo({ showConsole: false })
  const applicationTitle = oriTitle.replace(/[^\w]/g, '')
  const expected = 'MapleStory'
  if (applicationTitle !== expected) process.exit()

  // 雖然已經很近了，但每個技能還是多少有一些時間差
  // 不設定這個的話霹靂可以更快，但位置會跑掉
  // 或許可以設定每個技能有不同的延遲
  rb.setKeyboardDelay(110)

  let alreayAttack = false
  const current = Date.now()
  let attackPayload = null
  for (let i = 0; i < attackList.length && !useDefault; i++) {
    const attackPayload = attackList[i]
    if (attackPayload.previousTimestamp == null) attackPayload.previousTimestamp = Date.now()
    if (attackPayload.previousTimestamp + attackPayload.coldTime < current) {
      alreayAttack = true
      rb.setKeyboardDelay(attackPayload.beforeWaveDelay)
      rb.keyTap(attackPayload.code)

      // 隨機讓他更久一些
      attackPayload.previousTimestamp = Date.now() + randomNumber(2000, 1000)
      break
    }
  }

  const waveDelay = alreayAttack ? afterDelay ?? attackPayload?.waveDelayTime ?? 100 : 100
  if (!alreayAttack) _defaultAttack()

  rb.setKeyboardDelay(waveDelay)
  rb.keyTap('f')
  rb.setKeyboardDelay(10)

  function _defaultAttack() {
    rb.keyTap('v')
  }
}

function attackThrough({
  times = 5,
  direction = 'left',
  goBack = false,
  moveFirst = true,
  afterDelay = 200,
  useAttack = attack,
} = {}) {
  const attack = useAttack

  if (moveFirst) turn(direction)

  if (!goBack) {
    for (let i = 0; i < times - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })
    return
  }

  if (halfChance()) _endAndTurn()
  else _halfAndTurn()

  // 走到底再回頭
  function _endAndTurn() {
    const turnStep = randomNumber(Math.ceil(times / 2))
    for (let i = 0; i < times - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })

    direction === 'left' ? turn('right') : turn('left')

    for (let i = 0; i < turnStep - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })

    turn(direction)

    for (let i = 0; i < turnStep - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })
  }

  // 走到一半回頭
  function _halfAndTurn() {
    const halfStep = Math.ceil(times / 2)
    const halfhalfStep = Math.ceil(halfStep / 2)

    for (let i = 0; i < halfhalfStep - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })

    direction === 'left' ? turn('right') : turn('left')

    for (let i = 0; i < halfhalfStep - 1; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })

    turn(direction)

    for (let i = 0; i < times - halfStep + halfhalfStep; i++) {
      attack()
    }
    attack({ afterDelay, useDefault: true })
  }
}
function turn(direction = 'left') {
  rb.setKeyboardDelay(50)
  rb.keyTap(direction)
  rb.setKeyboardDelay(10)
}
function jUp() {
  goUp({ type: 'jump' })
}
function goUp({ type = 'top' } = {}) {
  // delay
  rb.setKeyboardDelay(200)
  rb.keyTap('7')

  if (type === 'shark') {
    rb.setKeyboardDelay(10)
    rb.keyTap('alt')
    rb.keyTap('d')
    return
  }

  rb.setKeyboardDelay(randomNumber(130, 100))
  rb.keyToggle('up', 'down')

  rb.setKeyboardDelay(randomNumber(130, 100))
  rb.keyTap('alt')
  rb.keyTap('alt')
  rb.setKeyboardDelay(10)
  rb.keyToggle('up', 'up')
  rb.setKeyboardDelay(randomNumber(630, 600))
  type === 'top' && rb.keyTap('d')
  rb.setKeyboardDelay(10)
}
function goDown({ delayMs = 500 } = {}) {
  rb.setKeyboardDelay(randomNumber(60, 50))
  rb.keyToggle('down', 'down')
  rb.setKeyboardDelay(10)
  rb.keyTap('alt')
  rb.setKeyboardDelay(randomNumber(delayMs + 20, delayMs))
  rb.keyToggle('down', 'up')
  rb.setKeyboardDelay(10)
}
function hop() {
  sleepWithRb(50)

  rb.setKeyboardDelay(randomNumber(100, 50))
  rb.keyTap('d')
  rb.setKeyboardDelay(randomNumber(310, 300))
  rb.keyTap('w')
  rb.setKeyboardDelay(10)
}
function jumpFar() {
  rb.setKeyboardDelay(100)
  rb.keyTap('alt')
  rb.setKeyboardDelay(100)
  rb.keyTap('alt')
  rb.setKeyboardDelay(175) // 150
  rb.keyTap('d')
  rb.setKeyboardDelay(50)
  rb.keyTap('w')
}
function halfChance() {
  return Math.random() > 0.5
}
function randomNumber(oriMax = 10, oriMin = 1) {
  const max = Math.max(oriMax, oriMin)
  const min = Math.min(oriMax, oriMin)

  return Math.floor(Math.random() * (max - min + 1)) + min
}
function left(times, goBack = halfChance()) {
  return attackThrough({ direction: 'left', times, goBack })
}
function right(times, goBack = halfChance()) {
  return attackThrough({ direction: 'right', times, goBack })
}
function justAttack(times) {
  return attackThrough({ moveFirst: false, times, goBack: false })
}

export function test() {
  hop()
}

export async function winter() {
  const buffAttack = () => attack({ buffType: ['buff', 'pagedown'] })
  const justAttack = async (times = 1) => {
    attackThrough({ moveFirst: false, times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }

  const left = async (times = 1) => {
    attackThrough({ direction: 'left', times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }
  const right = async (times = 1) => {
    attackThrough({ direction: 'right', times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }

  const ball = async () => {
    rb.keyTap('6')
    await delay(300)
  }

  const 瞬移 = async () => {
    await delay(300)
    rb.keyTap('up')
    await delay(200)
  }

  const shark = async () => {
    goUp({ type: 'shark' })
    await delay(150)
  }

  const genFn = () => [ball3].sort(() => Math.random() - 0.5)
  let fnList = []
  for (let i = 0; i < 100; i++) {
    if (fnList.length === 0) fnList = genFn()
    const fn = fnList.splice(0, 1)[0]
    console.log('fn:', fn)
    await fn()
  }

  async function ball3() {
    const ball3Result = randomNumber(2, 1)
    console.log('ball3Result:', ball3Result)

    switch (ball3Result) {
      case 1:
        await 右球()
        await 右球回家()
        break

      case 2:
        await ballRightFlow()
        break
    }

    await 時間()
  }

  async function ballRightFlow() {
    await 瞬移()
    await left(1)
    await ball()

    await 右球中球()
    await 中球左球()
    await 左球回家()
  }

  async function 右球中球() {
    const 右球中球Result = randomNumber(2, 1)
    console.log('右球中球Result: ', 右球中球Result)

    switch (右球中球Result) {
      case 1:
        hop()
        await delay(50)
        await justAttack(2)
        goDown()
        await delay(200)
        await justAttack(2)
        await ball()
        break

      case 2:
        await shark()
        await justAttack(2)
        goDown()
        await delay(200)
        await right(2)
        goDown()
        await delay(200)
        await left(3)
        await ball()
        break
    }
  }
  async function 中球左球() {
    const 中球左球Result = randomNumber(2, 1)
    console.log('中球左球Result: ', 中球左球Result)

    switch (中球左球Result) {
      case 1:
        hop()
        await delay(50)
        await justAttack(1)
        hop()
        await delay(50)
        await justAttack(3)
        await right(1)
        await shark()
        await justAttack(1)
        await ball()
        break

      case 2:
        await shark()
        await justAttack(1)
        hop()
        await delay(50)
        await justAttack(1)
        hop()
        await delay(50)
        await justAttack(2)
        await right(3)
        await ball()
        break
    }
  }
  async function 左球回家() {
    const 左球回家Result = randomNumber(2, 1)
    console.log('左球回家Result: ', 左球回家Result)

    switch (左球回家Result) {
      case 1:
        goDown()
        await delay(200)
        await left(3)
        goDown()
        await delay(200)
        await right(5, 7)
        goDown()
        await delay(200)
        break

      case 2:
        await left(1)
        await shark()
        await justAttack(2)
        await right(3)
        goDown()
        await delay(200)
        await justAttack(2)
        goDown()
        await delay(200)
        await justAttack(1)
        goDown()
        await delay(200)
        await right(2, 4)
        goDown()
        await delay(200)
        break
    }
  }

  async function 時間() {
    const list1 = [中平移, 右上, 右上左上]
    const list2 = [上圈, 下圈, 瞬下回]
    let f1 = list1[randomNumber(list1.length - 1, 0)]
    let f2 = list2[randomNumber(list2.length - 1, 0)]

    if (f1 !== 中平移) {
      console.log('時間: ', f1)
      await f1()
      return
    }

    ;[f1, f2] = randomNumber(1, 0) ? [f1, f2] : [f2, f1]

    console.log('時間: ', f1)
    await f1()
    console.log('時間: ', f2)
    await f2()

    async function 瞬下回() {
      await 瞬移()
      await left(1)
      goDown()
      await delay(200)
      goDown()
      await delay(200)
      await right(2)
      await left(5, 8)
      goDown()
      await delay(200)
    }

    async function 右上左上() {
      await 瞬移()
      await left(1)
      await shark()
      await justAttack(3)
      await right(3)
      await left(4)
      goDown()
      await delay(200)
      await justAttack(1)
      hop()
      await delay(50)
      await justAttack(2)
      hop()
      await delay(50)
      await shark()
      await justAttack(3)
      await right(3)
      await left(3)
      goDown()
      await delay(200)
      goDown()
      await delay(200)
      await right(4)
      goDown()
      await delay(200)
      await justAttack(5)
      goDown()
      await delay(200)
    }

    async function 右上() {
      await 平移最右()
      await left(2)

      await shark()
      await justAttack(3)
      goDown()
      await delay(200)
      await justAttack(1)
      goDown()
      await delay(200)
      await justAttack(2)

      await right(3)
      turn('left')
      turn('left')
      turn('right')
      hop()
      await delay(50)
      await justAttack(2)

      await left(1)
      if (halfChance()) {
        hop()
        await delay(50)
        await justAttack(3)

        hop()
        await delay(50)
        await justAttack(2)

        hop()
        await delay(50)
        await justAttack(3)

        goDown()
        await delay(200)
        await justAttack(1)
        await right(randomNumber(5, 3))

        goDown()
        await delay(200)
      } else {
        goDown()
        await delay(200)
        await right(1)
        await left(6, 8)
        goDown()
        await delay(200)
      }
    }

    async function 中平移() {
      await 平移最右()

      turn('left')
      turn('left')
      turn('left')

      goDown()
      await delay(200)
      await right(1)
      await left(2)
      hop()
      await delay(50)
      await justAttack(3)
      goDown()
      await delay(200)
      await left(3, 5)
      goDown()
      await delay(200)
    }

    async function 上圈() {
      await right(2)
      await shark()
      await justAttack(2)
      await left(2)
      await right(3)
      await left(3)
      goDown()
      await delay(200)
      await justAttack(1)
      await right(1)
      goDown()
      await delay(200)
      await justAttack(2)
      goDown()
      await delay(200)
      await right(randomNumber(7, 5))
      goDown()
      await delay(200)
    }

    async function 下圈() {
      switch (randomNumber(1, 1)) {
        case 1:
          await right(2)
          goDown()
          await delay(200)
          await justAttack(2)
          goDown()
          await delay(200)
          await justAttack(randomNumber(7, 3))
          await left(randomNumber(6, 5))
          goDown()
          await delay(200)
          break

        case 2:
      }
    }
  }

  async function 平移最右() {
    await right(2)
    hop()
    await delay(50)
    await justAttack(3)
    hop()
    await delay(50)
    await justAttack(3)
    hop()
    await delay(50)
    await justAttack(3)
    hop()
    await delay(50)
    await justAttack(1)
  }

  async function 中球() {
    const result = randomNumber(3, 1)
    console.log('中球: ', result)

    switch (result) {
      case 1:
        await right(2)
        await ball()
        goDown()
        await delay(200)
        await right(2)
        hop()
        await delay(50)
        await justAttack(2)
        await ball()
        break

      case 2:
        await right(2)
        await ball()
        hop()
        await delay(50)
        await justAttack(1)
        goDown()
        await delay(200)
        await justAttack(1)
        await ball()
        break

      case 3:
        await right(2)
        await ball()
        goUp({ type: 'shark' })
        await delay(150)
        await justAttack(2)
        goDown()
        await delay(200)
        await justAttack(1)
        goDown()
        await delay(200)
        await justAttack(1)
        await ball()
        break
    }

    await justAttack(1)
  }

  async function 中球右球() {
    const n = randomNumber(3, 1)
    console.log('中球右球:', n)

    switch (n) {
      case 3:
        goDown()
        await delay(200)
        await justAttack(3)
        await left(5, 3)
        goDown()
        await delay(200)
        await 瞬移()
        await justAttack(1)
        await ball()
        break

      case 1:
        hop()
        await delay(50)
        await justAttack(3)
        await _上頂()
        await justAttack(2)
        goDown()
        await delay(200)
        await justAttack(1)
        await left(2)
        await ball()

        break

      case 2:
        goUp({ type: 'shark' })
        await delay(250)
        await justAttack(2)
        hop()
        await delay(50)
        await justAttack(2)
        hop()
        await delay(50)
        await left(2)
        await ball()
    }
  }

  async function 右球() {
    await 中球()
    await 中球右球()
  }

  async function 右球回家() {
    const n = randomNumber(3, 1)
    console.log('右球回家:', n)

    switch (n) {
      case 3:
        await shark()
        await justAttack(2)
        goDown()
        await delay(200)
        await right(2)
        goDown()
        await delay(200)
        await left(2)
        goDown()
        await delay(200)
        await right(3)
        await left(4, 7)
        goDown()
        await delay(200)
        break

      case 1:
        goDown()
        await delay(200)
        await justAttack(3)
        goDown()
        await delay(200)
        await justAttack(randomNumber(5, 3))
        goDown()
        await delay(200)
        break

      case 2:
        hop()
        await delay(50)
        await justAttack(randomNumber(2, 1))
        hop()
        await delay(50)
        await justAttack(randomNumber(2, 1))
        hop()
        await delay(50)
        await justAttack(randomNumber(2, 1))
        hop()
        await delay(50)
        await justAttack(randomNumber(2, 1))
        await right(1)
        goDown()
        await delay(200)
        goDown()
        await delay(200)
        goDown()
        await delay(200)
        break
    }
  }

  async function _上頂() {
    switch (randomNumber(2, 1)) {
      case 1:
        rb.keyTap('t')
        await delay(1800)
        break

      case 2:
        goUp()
        await delay(250)
        goUp({ type: 'shark' })
        await delay(150)
        break
    }
  }
}

export async function queen() {
  const buffAttack = () => attack({ buffType: ['buff'] })
  const justAttack = async (times = 1) => {
    attackThrough({ moveFirst: false, times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }

  const left = async (times = 1) => {
    attackThrough({ direction: 'left', times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }
  const right = async (times = 1) => {
    attackThrough({ direction: 'right', times, goBack: false, useAttack: buffAttack })
    await delay(50)
  }
  const bigJump = async () => {
    jumpFar()
    await delay(500)
  }

  const ball = async () => {
    rb.keyTap('6')
    await delay(300)
  }

  const shark = async () => {
    goUp({ type: 'shark' })
    await delay(150)
  }

  const hopJump = async () => {
    hop()
    await delay(50)
  }

  const down = async () => {
    goDown()
    await delay(200)
  }

  const 瞬移 = async () => {
    await delay(300)
    rb.keyTap('up')
    await delay(200)
  }

  const blueBall = async () => {
    rb.keyTap('pagedown')
    await delay(500)
  }

  const upJump = async () => {
    jUp()
    await delay(200)
  }

  const genFn = () => [q1, q2].reduce((acc, fn) => acc.concat([fn, fn]), []).sort(() => Math.random() - 0.5)
  let fnList = []
  let currentIndex = 0
  for (let i = 0; i < 100; i++) {
    currentIndex = i
    if (fnList.length === 0) fnList = genFn()
    const fn = fnList.splice(0, 1)[0]
    console.log('fn:', fn)
    await fn()
  }

  async function q1() {
    await Q三下球()
    await Q下球時間()

    async function Q三下球() {
      const result = currentIndex % 6 === 0 ? 1 : currentIndex % 3 === 0 ? 2 : randomNumber(1, 2)
      console.log('Q三下球: ', result)

      await 瞬移()
      await right(2)
      await ball()

      switch (result) {
        case 1:
          await shark()
          await justAttack(2)
          await hopJump()
          await justAttack(2)
          await hopJump()
          await justAttack(2)
          await down()
          await justAttack(1)
          await left(3)
          await ball()

          await hopJump()
          await justAttack(1)
          await blueBall()

          await down()
          await justAttack(3)
          await hopJump()
          await justAttack(2)
          await right(3)
          await ball()
          break

        case 2:
          await shark()
          await justAttack(2)
          await left(2)
          await right(3)
          await down()
          await justAttack(1)
          await blueBall()

          await hopJump()
          await justAttack(2)
          await hopJump()
          await justAttack(1)
          await left(2)
          await ball()

          await down()
          await justAttack(1)
          await right(2)
          await left(3)
          await hopJump()
          await justAttack(1)
          await hopJump()
          await justAttack(1)
          await right(2)
          await ball()
      }
    }

    async function Q下球時間() {
      const result = currentIndex % 6 === 0 ? 2 : currentIndex % 3 === 0 ? 1 : randomNumber(1, 2)
      console.log('Q下球時間: ', result)

      switch (result) {
        case 1:
          if (currentIndex % 2) {
            await hopJump()
            await justAttack(2)
            await hopJump()
            await justAttack(3)
            await left(3)
            turn('right')
          }

          await down()
          await justAttack(currentIndex % 2 ? 2 : 4)
          await left(8)
          await right(8)
          await left(8)
          await right(8)
          await left(10)
          await hopJump()
          await delay(500)
          break

        case 2:
          await upJump()
          await justAttack(2)
          await left()
          await hopJump()
          await justAttack(1)
          await right(2)
          await shark()
          await justAttack(2)
          await left(2)
          await right(3)
          await hopJump()
          await justAttack(1)
          await down()
          await justAttack(1)
          await left(2)
          await shark()
          await justAttack(1)
          await right(2)
          await hopJump()
          await justAttack(2)
          await down()
          await left(2)
          await down()
          await justAttack(2)
          await down()
          await left(8)
          await hopJump()
          await delay(500)
      }
    }
  }

  async function q2() {
    await 三右球()
    await 右球時間()

    async function 三右球() {
      console.log('三右球')

      await 瞬移()
      await right(2)
      await ball()

      await 下球()
      await 下球右球()

      async function 下球() {
        const result = randomNumber(3, 1)
        console.log('下球: ', result)

        switch (result) {
          case 1:
            await hopJump()
            await justAttack(1)
            await left(1)
            await down()
            await justAttack(1)
            await right(2)
            await ball()
            break

          case 2:
            await shark()
            await justAttack(1)
            await down()
            await justAttack(1)
            await left(1)
            await down()
            await justAttack(1)
            await right(2)
            await ball()
            break

          case 3:
            await left(2)
            await right()
            await down()
            await justAttack(2)
            await ball()
            break
        }
      }

      async function 下球右球() {
        const result = randomNumber(2, 1)
        console.log('下球右球: ', result)

        switch (result) {
          case 1:
            await hopJump()
            await justAttack()
            await hopJump()
            await justAttack(3)
            await shark()
            await justAttack(2)
            await left(3)
            await ball()
            break

          case 2:
            await upJump()
            await justAttack(2)
            await hopJump()
            await justAttack(1)
            await hopJump()
            await justAttack(1)
            await left(2)
            await ball()
            break
        }
      }
    }

    async function 右球時間() {
      const result = randomNumber(2, 1)
      console.log('右球時間: ', result)

      switch (result) {
        case 1:
          await upJump()
          await justAttack()
          await right(2)
          await left(2)
          await hopJump()
          await justAttack()
          await hopJump()
          await justAttack(2)
          await down()
          await justAttack(1)
          turn('right')
          await down()
          await justAttack(8)

          turn('left')
          turn('left')
          turn('left')
          rb.keyTap('t')
          await delay(1500)

          await justAttack(2)
          await down()
          await justAttack(2)
          await hopJump()
          await justAttack(1)
          await hopJump()
          await justAttack(3)
          await down()
          await justAttack(1)
          await right(3)
          await left(7)
          await hopJump()
          await delay(500)
          break

        case 2:
          await hopJump()
          await justAttack()
          await shark()
          await justAttack()
          await hopJump()
          await justAttack(2)
          await right(3)
          await down()
          await justAttack(1)
          await down()
          await justAttack(1)
          await down()
          await justAttack(4)
          await left(9)
          await hopJump()
          await delay(500)
          await 瞬移()
          await right(2)
          await shark()
          await justAttack(2)
          await down()
          await justAttack(2)
          await down()
          await justAttack()
          await hopJump()
          await justAttack(2)
          await left(2)
          await right(3)
          rb.keyTap('t')
          await delay(1500)

          await left(2)

          await bigJump()

          await justAttack(3)
          await down()
          await justAttack(1)
          await bigJump()
          await delay(1500)
          await justAttack(1)
          await hopJump()
          await delay(500)
          break
      }
    }
  }
}

// TODO(flyc): 要看看有沒有不需要 promise 的 sleep 功能
function sleepWithRb(msec = 200) {
  rb.setKeyboardDelay(msec)
  rb.keyTap('7')
  rb.setKeyboardDelay(10)
}
