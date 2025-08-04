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
function randomNumber(max = 10, min = 1) {
  if (max < min) console.log('[randomNumber] max is smaller than min!', max, min)

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

export async function spring() {
  const buffAttack = () => attack({ buffType: ['buff', 'pagedown'] })
  const justAttack = (times = 1) => attackThrough({ moveFirst: false, times, goBack: false, useAttack: buffAttack })
  const left = (times = 1) => attackThrough({ direction: 'left', times, goBack: false, useAttack: buffAttack })
  const right = (times = 1) => attackThrough({ direction: 'right', times, goBack: false, useAttack: buffAttack })

  const genFn = () => [s_1, s_2, s_3].sort(() => Math.random() - 0.5)
  let fnList = []
  for (let i = 0; i < 100; i++) {
    if (fnList.length === 0) fnList = genFn()
    const fn = fnList.splice(0, 1)[0]
    console.log('fn:', fn)
    await fn()
  }

  async function s_3() {
    await _到左頂右側()
    left(3)
    await delay(50)
    right(1)
    await delay(50)
    goDown()
    await delay(100)
    rb.keyTap('6')
    await delay(300)
    justAttack(3)
    await delay(50)
    goDown()
    await delay(100)
    hop()
    await delay(100)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(300)
    justAttack(1)
    await delay(50)

    if (halfChance()) {
      await 無繩上頂()
      justAttack(2)
      await delay(100)
      hop()
      await delay(100)
      justAttack(2)
      await delay(50)
    } else {
      goDown()
      await delay(100)
      justAttack(2)
      await delay(50)
      await 無繩上頂()
      justAttack(2)
      await delay(50)
    }

    goDown()
    await delay(100)
    justAttack(1)
    await delay(50)
    left(3)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(1)
    await delay(50)
    right(1)
    await delay(50)
    await 無繩上頂()
    justAttack(3)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(1)
    await delay(50)
    left(2)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(1)
    await delay(50)
    right(2)
    await delay(50)
    goDown()
    await delay(100)
    left(randomNumber(7, 4))
    goDown()
    await delay(400)
    rb.keyTap('up')
    await delay(150)
    justAttack(1)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(2)
    await delay(50)
    goDown()
    await delay(100)
    left(randomNumber(7, 4))
    goDown()
    await delay(100)
  }

  async function s_2() {
    goDown()
    await delay(100)
    goDown()
    await delay(100)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(300)
    left(1)
    await delay(50)
    goDown()
    await delay(400)

    rb.keyTap('up')
    await delay(150)
    left(1)
    await delay(50)
    goDown()
    await delay(100)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(300)
    justAttack(2)
    await delay(50)
    right(1)
    await delay(50)
    await 無繩上頂()
    justAttack(2)
    await delay(50)
    left(3)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(1)
    await delay(50)
    goDown()
    await delay(300)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(300)
    justAttack(2)
    await delay(50)

    right(2)
    await delay(50)
    await 無繩上頂()

    justAttack(1)
    await delay(50)
    left(1)
    await delay(50)
    hop()
    await delay(50)
    justAttack(3)
    await delay(50)
    right(1)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(2)
    await delay(50)

    for (let i = 0; i < 5; i++) {
      left(3)
      await delay(50)
      right(3)
      await delay(50)
    }

    if (halfChance()) {
      left(4)
      await delay(50)
      hop()
      await delay(50)
      justAttack(2)
      await delay(50)
      goDown()
      await delay(100)
      justAttack(1)
      await delay(50)
      right(2)
      goDown()
      await delay(100)
      justAttack(randomNumber(7, 5))
      await delay(50)
      goDown()
      await delay(100)
    } else {
      goDown()
      await delay(100)
      goDown()
      await delay(100)
      right(4)
      await delay(50)
      halfChance() && left(4)
      await delay(50)
      goDown()
      await delay(100)
    }
  }

  async function s_1() {
    await _到左頂右側()

    left(3)
    await delay(50)
    right(1)
    await delay(50)
    goDown()
    await delay(100)
    justAttack(3)
    await delay(50)
    goDown()
    await delay(100)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(300)
    justAttack(2)
    await delay(50)

    if (halfChance()) {
      hop()
      await delay(50)
      justAttack(2)
      await delay(50)
      await 無繩上頂()
      justAttack(2)
      await delay(50)
      hop()
      await delay(50)
      justAttack(2)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(1)
      await delay(50)
      left(3)
      await delay(50)
      goDown()
      await delay(50)
      rb.keyTap('alt')
      rb.keyTap('6')
      await delay(300)
    } else {
      goDown()
      await delay(50)
      right(3)
      await delay(50)
      rb.keyTap('t')
      await delay(2300)
      justAttack(2)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(1)
      await delay(50)
      left(2)
      await delay(50)
      goDown()
      await delay(50)
      rb.keyTap('alt')
      rb.keyTap('6')
      await delay(300)
    }

    justAttack(2)
    await delay(50)
    right(1)
    await delay(50)
    goUp()
    await delay(300)
    justAttack(2)
    await delay(50)
    left(3)
    await delay(50)
    goDown()
    await delay(100)

    if (halfChance()) {
      justAttack(3)
      await delay(50)
      right(1)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(2)
      await delay(50)
      left(2)
      await delay(50)
      right(2)
      await delay(50)
      goUp()
      await delay(50)
      justAttack(2)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(2)
    } else {
      for (let j = 0; j < 3; j++) {
        left(3)
        await delay(50)
        right(3)
        await delay(50)
      }
    }

    if (halfChance()) {
      left(1)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(2)
      await delay(50)
      right(1)
      await delay(50)
      goDown()
      await delay(50)
      justAttack(3)
      await delay(50)
      left(halfChance() ? 8 : 6)
      await delay(50)
      goDown()
      await delay(50)
    } else {
      goDown()
      await delay(50)
      justAttack(2)
      goDown()
      await delay(200)
      left(9)
      await delay(50)
      goDown()
      await delay(50)
    }
  }

  async function _到左頂右側() {
    goDown()
    await delay(100)
    rb.keyTap('6')
    await delay(300)
    goDown()
    await delay(100)

    // _到左頂右側
    switch (randomNumber(2, 0)) {
      case 0:
        right(3)
        await delay(50)
        goUp({ type: 'shark' })
        await delay(100)
        goUp({ type: 'shark' })
        await delay(100)
        goUp({ type: 'shark' })
        await delay(100)
        justAttack(1)
        await delay(50)
        break

      case 1:
        right(2)
        await delay(50)
        rb.keyTap('t')
        await delay(1800)
        break

      case 2:
        goDown()
        await delay(50)
        turn('right')
        await delay(50)
        jumpFar()
        await delay(400)
        goUp({ type: 'shark' })
        await delay(100)
        justAttack(2)
        await delay(50)
        break
    }

    justAttack(2)
    await delay(50)
  }

  async function 無繩上頂() {
    switch (randomNumber(2, 0)) {
      case 0:
        rb.keyTap('t')
        await delay(1800)
        break

      case 1:
        goUp()
        await delay(250)
        goUp({ type: 'shark' })
        await delay(150)
        break

      case 2:
        goUp({ type: 'shark' })
        await delay(150)
        goUp({ type: 'shark' })
        await delay(150)
        goUp({ type: 'shark' })
        await delay(150)
        break
    }
  }
}

// TODO(flyc): 要看看有沒有不需要 promise 的 sleep 功能
function sleepWithRb(msec = 200) {
  rb.setKeyboardDelay(msec)
  rb.keyTap('7')
  rb.setKeyboardDelay(10)
}
