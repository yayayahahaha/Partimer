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
function generateBuffList(buffType = 'all') {
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
      coldTime: 30 * 1000,
      priority: true,
      previousTimestamp,
      buffType: 'stay-attack',
    },
  ].filter((buffInfo) => {
    if (buffType === 'all') return true
    return buffType === buffInfo.buffType
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
    delayTime: 100,
    previousTimestamp: null,
  },
  {
    code: 'a',
    coldTime: 13 * 1000,
    delayTime: 75,
    previousTimestamp: null,
  },
  {
    code: 'y',
    coldTime: 45 * 1000,
    delayTime: 75,
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
  rb.setKeyboardDelay(randomNumber(120, 100))

  let alreayAttack = false
  const current = Date.now()
  for (let i = 0; i < attackList.length && !useDefault; i++) {
    const attack = attackList[i]
    if (attack.previousTimestamp == null) attack.previousTimestamp = Date.now()
    if (attack.previousTimestamp + attack.coldTime < current) {
      alreayAttack = true
      rb.keyTap(attack.code)

      // 隨機讓他更久一些
      attack.previousTimestamp = Date.now() + randomNumber(2000, 1000)
    }
  }

  const waveDelay = alreayAttack ? afterDelay || attack.delayTime : 100
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

function pickOne(list = []) {
  return list[Math.floor(Math.random() * list.length)] ?? null
}

export async function 奧迪溫雅努斯() {
  const buffAttack = () => attack({ buffType: 'buff' })
  const justAttack = (time = 1) => [...Array(time)].forEach(buffAttack)
  const left = async (time = 1) => {
    await delay(100)
    turn('left')
    await delay(100)
    justAttack(time)
  }
  const right = async (time = 1) => {
    await delay(100)
    turn('right')
    await delay(100)
    justAttack(time)
  }

  for (let i = 0; i < 1000; i++) {
    await aLoop()
  }

  async function aLoop() {
    await _downBack()
    await _setBack()
    for (let i = 0; i < 10; i++) {
      await standAttack()
      await delay(1312, 0)
    }
  }

  async function standAttack(time = 1) {
    for (let i = 0; i < time; i++) {
      turn('right')
      rb.keyTap('v')
      await delay(500)
      turn('left')
      rb.keyTap('v')
    }
  }

  async function _downBack() {
    await right(2)
    goDown()
    await right(7)
    await left(10)
    await right(2)
    goUp()
    justAttack()
    await left(1)
    goDown()
  }

  async function _setBack() {
    await right(2)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
    hop()
    await delay(100)
    rb.keyTap(6)

    await delay(300)
    goUp({ type: 'jump' })
    await delay(700)
    goDown()
    await delay(700)

    await left(2)
    hop()
    await delay(100)
    rb.keyTap(6)
    justAttack(2)
    hop()
    await delay(100)
    rb.keyTap('pagedown')
    justAttack(2)
    hop()
  }
}

export async function 實驗室() {
  const buffAttack = () => attack({ buffType: 'buff' })
  const justAttack = (times = 1) => attackThrough({ moveFirst: false, times, goBack: false, useAttack: buffAttack })
  const left = (times = 1) => attackThrough({ direction: 'left', times, goBack: false, useAttack: buffAttack })
  const right = (times = 1) => attackThrough({ direction: 'right', times, goBack: false, useAttack: buffAttack })

  async function newLabLoop() {
    right(3)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(250)
    left(3)
    goDown()
    justAttack(1)
    right(2)
    goDown()

    rb.keyTap('pagedown')
    await delay(400)
    right(1)
    await delay(100)

    left(9)
    await delay(150)
    right(1)
    goUp()
    justAttack(1)
    await delay(150)
    rb.keyTap('alt')
    rb.keyTap('6')
    await delay(250)
    goDown()
    await delay(150)
    goDown()
    await delay(150)
    right(5)
    goUp()
    justAttack(3)
    goDown()
    justAttack(2)
    await delay(150)
    left(3)
    await delay(100)
    hop()
    justAttack(2)
    await delay(100)
    hop()
    justAttack(2)
    right(1)
    hop()

    justAttack(3)
    goDown()
    justAttack(2)
    await delay(150)
    left(3)
    await delay(100)
    hop()
    justAttack(2)
    await delay(100)
    hop()
    justAttack(2)
    right(1)
    await delay(100)
    hop()

    justAttack(4)
    left(1)
    goUp()
    justAttack(1)
    goDown()
    justAttack(2)
    right(1)
    goDown()
  }

  for (let i = 0; i < 100; i++) {
    await newLabLoop()
  }
}

export function redRobot(simple = false) {
  const createMovieList = () => [redGroup1, redGroup2, goAndBack].sort(() => Math.random() - 0.5)
  if (simple) {
    let downCount = halfChance() ? 4 : 3
    for (let i = 0; i < 1000; i++) {
      if (i % downCount === 0) {
        _redBot2()
        downCount = halfChance() ? 4 : 3
      }
      _redRobot4()
    }
    return
  }

  let fn = null
  let fnList = []
  for (let i = 0; i < 100; i++) {
    fnList = fnList.length === 0 ? [...createMovieList(), halfChance() ? redGroup3 : Function.prototype] : fnList

    console.log('fnList:', fnList)
    fn = fnList.splice(0, 1)[0]
    fn()
  }

  function redGroup1() {
    function goMiddleTop() {
      function goMiddle1() {
        right(2, false)
        jUp()
        justAttack(2)
        left(2, false)
        right(3, false)
        hop()
        justAttack(2)
        left(2, false)
        right(3, false)
      }

      function goMiddle2() {
        right(2, false)
        hop()
        justAttack(2)
        jUp()
        justAttack(3)
      }

      function goMiddle3() {
        right(2, false)
        goDown()
        justAttack(2)
        goUp()
        justAttack(2)
      }

      function goMiddle4() {
        right(2, false)
        jUp()
        justAttack(2)
        left(1, false)
        turn('right')
        turn('right')
        jumpFar()
        justAttack(2)
      }

      function goMiddle5() {
        right(2, false)
        goDown()
        justAttack(8)
        left(5, false)
        goUp()
        justAttack(2)
        right(3, false)
      }

      const picked = pickOne([goMiddle1, goMiddle2, goMiddle3, goMiddle4, goMiddle5])
      console.log(picked)
      picked()
    }

    function MiddleTop2TopRight() {
      function M2TR_1() {
        goDown()
        justAttack(2)
        left(1, false)
        turn('right')
        turn('right')
        turn('right')
        jumpFar()
        justAttack(2)
      }

      function M2TR_2() {
        goDown()
        justAttack(2)
        hop()
        justAttack(2)
        left(1, false)
        jUp()
        justAttack(2)
        right(1, false)
      }

      function M2TR_3() {
        left(1, false)
        turn('right')
        jumpFar()
        justAttack(2)
      }

      function M2TR_4() {
        goDown()
        justAttack(2)
        goDown()
        justAttack(2)
        turn('left')
        turn('left')
        goUp()

        // 可能會爬上繩子，所以做個防呆
        rollFoolProof()

        justAttack(2)
        right(2, false)
      }

      function M2TR_5() {
        goDown()
        justAttack(2)
        hop()
        justAttack(2)
        hop()
        justAttack(2)
        turn('left')
        jumpFar()
        justAttack(2)
        right(2, false)
      }

      const picked = pickOne([M2TR_1, M2TR_2, M2TR_3, M2TR_4, M2TR_5])
      console.log(picked)
      picked()
    }

    function topRightBack() {
      function topRightBack1() {
        left(2, false)
        goDown()
        justAttack(2)
        hop()
        justAttack(2)
        right(2, false)
        left(3)
        hop()
        justAttack(2)
        hop()
        justAttack(2)
      }

      function topRightBack2() {
        turn('left')
        turn('left')
        turn('left')
        turn('right')
        goDown()
        justAttack(2)
        left(1, false)
        goDown()
        justAttack(2)

        left(5, false)
        right(2, false)
        goUp()
        justAttack(2)
        left(3, false)
        right(1, false)
        goDown()
        justAttack(2)
        left(2, false)
      }

      function topRightBack3() {
        left(2, false)
        jumpFar()
        justAttack(2)
        hop()
        justAttack(2)
        right(1, false)
        goDown()
        justAttack(2)
        left(2, false)
      }

      function topRightBack4() {
        left(2, false)
        jumpFar()
        justAttack(2)
        goDown()
        justAttack(2)
        hop()
        justAttack(2)
      }

      function topRightBack5() {
        left(2, false)
        goDown()
        justAttack(2)
        hop()
        justAttack(2)
        goDown()
        justAttack(3)
        goUp()
        justAttack(2)

        if (halfChance()) {
          justAttack(1)
          right(1, false)
        }

        right(1, false)
        turn('left')
        turn('left')
        turn('left')
        turn('left')
        goDown()
        justAttack(2)
      }

      const picked = pickOne([topRightBack1, topRightBack2, topRightBack3, topRightBack4, topRightBack5])
      console.log(picked)
      picked()
    }

    function goTopRight() {
      function goTopRight1() {
        goMiddleTop()
        MiddleTop2TopRight()
      }

      function goTopRight2() {
        right(2, false)
        goDown()
        justAttack(5)
        turn('left')
        turn('left')
        goUp()

        // 可能會爬上繩子，所以做個防呆
        rollFoolProof()

        justAttack(2)
        right(2, false)
      }

      const picked = pickOne([goTopRight1, goTopRight1, goTopRight1, goTopRight2])
      console.log(picked)
      picked()
    }

    goTopRight()
    topRightBack()
  }

  function goAndBack() {
    function goAndBack1() {
      const times = Math.ceil(Math.random() * 3)
      console.log(`goAndBack times: ${times}`)
      function _stuff() {
        Array(times)
          .fill()
          .forEach(() => {
            hop()
            justAttack(2)
          })
      }

      right(2, false)
      _stuff()
      left(2, false)
      _stuff()
    }

    function goAndBack2() {
      right(2, false)
      hop()
      jUp()
      justAttack(2)
      left(3, false)
      goDown()
      justAttack(2)
      hop()
      justAttack(2)
    }

    function goAndBack3() {
      right(2, false)
      jUp()
      justAttack(2)
      left(3, false)
      right(1, false)
      goDown()
      justAttack(2)
      left(3, false)
    }

    const picked = pickOne([goAndBack1, goAndBack2, goAndBack3])
    console.log(picked)
    picked()
  }

  function _redRobot4() {
    right(2, false)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
    hop()
    justAttack(2)

    left(2, false)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
  }
  function _redBot2() {
    right(2)
    goDown()
    justAttack(3)
    right(5)

    left(11, false)

    right(2, false)
    goUp()
    justAttack(2)
    left(3)
    goDown()
  }
  function redGroup2() {
    function redBot1() {
      right(2, false)
      hop()
      justAttack(2)
      hop()
      justAttack(2)
      hop()
      justAttack(2)

      left(1, false)
      jUp()
      justAttack(2)
      right(2, false)
      left(3, false)
      jumpFar()
      justAttack(2)
      goDown()
      right(2)
      left(3, false)
      hop()
      justAttack(3)
    }

    function redBot3() {
      right(2)
      jUp()
      justAttack(2)
      jumpFar()
      justAttack(2)
      goDown()
      justAttack(2)
      hop()
      justAttack(2)

      left(2)
      hop()
      justAttack(2)
      hop()
      justAttack(2)
      hop()
      justAttack(2)
    }

    const picked = pickOne([redBot1, _redBot2, redBot3, _redRobot4])
    console.log(picked)
    picked()
  }

  function redGroup3() {
    right(2, false)
    goDown()
    justAttack(8)
    left(5, false)
    left(5)
    right(2, false)
    goUp()
    justAttack(2)
    hop()
    justAttack(2)
    left(1, false)
    turn('right')
    turn('right')
    turn('right')
    jumpFar()
    justAttack(2)
    left(2, false)
    goDown()
    justAttack(2)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
    hop()
    justAttack(2)
  }
}

export function spring() {
  const genFnList = () => [sp1, sp2, sp3, sp4, sp5, sp6]
  let fnList = []

  for (let i = 0; i < 1000; i++) {
    if (fnList.length === 0) fnList = [...new Array(randomNumber(3, 1))].map(() => genFnList()).flat()
    const fn = fnList.splice(randomNumber(fnList.length - 1, 0), 1)[0]
    console.log(fn, fnList)
    fn()
  }

  function sp1() {
    right(3)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(halfChance() ? 2 : 3)
    goDown()
    justAttack(1)
    goDown()
    left(halfChance() ? 6 : 8)
    goDown()
  }

  function sp2() {
    right(2)
    goDown()
    justAttack(1)
    left(halfChance() ? 2 : 3)
    goDown()
    justAttack(1)
    right(halfChance() ? 4 : 6)
    goDown()
  }

  function sp3() {
    right(3)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(halfChance() ? 1 : 2)
    goDown()
    justAttack(halfChance() ? 1 : 2)
    left(halfChance() ? 2 : 3)
    goDown()
    justAttack(5)
    goDown()
  }

  function sp4() {
    right(2)
    goDown()
    justAttack(halfChance() ? 1 : 2)
    left(halfChance() ? 2 : 3)
    hop()
    justAttack(1)
    goDown()
    justAttack(1)
    right(halfChance() ? 6 : 8)
    goDown()
  }

  function sp5() {
    right(3)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(halfChance() ? 1 : 2)
    left(halfChance() ? 2 : 3)
    goDown()
    justAttack(1)
    right(halfChance() ? 3 : 4)
    goDown()
    justAttack(1)
    left(halfChance() ? 4 : 6)
    goDown()
  }

  function sp6() {
    left(2)
    right(1, false)
    goDown()
    justAttack(1)
    hop()
    justAttack(halfChance() ? 1 : 2)
    goUp()
    justAttack(2)
    hop()
    justAttack(halfChance() ? 1 : 2)
    hop()
    justAttack(1)
    left(1, false)
    goDown()
    justAttack(1)
    right(3, false)
    left(halfChance() ? 3 : 2, false)
    goDown()
    justAttack(halfChance() ? 1 : 2)
    goDown()
    justAttack(randomNumber(6, 3))
    goDown()
  }
}

// TODO(flyc): 要看看有沒有不需要 promise 的 sleep 功能
function sleepWithRb(msec = 200) {
  rb.setKeyboardDelay(msec)
  rb.keyTap('7')
  rb.setKeyboardDelay(10)
}

// 這個時候是面左的，最後會預計往左 justAttack
function rollFoolProof() {
  sleepWithRb(300)
  justAttack(2)

  rb.keyToggle('up', 'down')
  sleepWithRb(750)
  rb.keyToggle('up', 'up')
  sleepWithRb(200)
  rb.keyTap('v')
  sleepWithRb(200)
  right(1, false)
  turn('left')
  turn('left')
  turn('left')
  rb.keyTap('v')
  sleepWithRb(750)
  jUp()
}
