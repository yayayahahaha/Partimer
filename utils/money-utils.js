// TODO(flyc): 「正在搜尋中」 和 「正在領取中」目前還沒有測試完成

import { clickMouse, clickRightMouse } from './mouse-control.js'
import { keyIn, moveMouseByOffset, delay, getApplicationInfo, getTextByOffset } from './others.js'
import rb from 'robotjs'
import { waitUntil } from './waitUntil.js'

const pressEnter = () => rb.keyTap('enter')

// 1366 * 768
// 城鎮
const 裝備_offset = { x: 30, y: 124 }
const 背包整理_offest = { x: 172, y: 486 }
const 背包向上_offest = { x: 208, y: 496 }

// market
const 查詢_offset = { x: 115, y: 126 }
const 市場搜尋_offset = { x: 198, y: 85 }
const 防具_offset = { x: 135, y: 168 }
const 防具重置_offset = { x: 135, y: 629 }
const 防具等級_offset = { x: 106, y: 369 }
const 防具價格_offset = { x: 211, y: 392 }
const 防具搜尋_offset = { x: 214, y: 637 }
const 武器_offset = { x: 147, y: 670 }
const 武器重置_offset = { x: 136, y: 631 }
const 武器等級_offset = { x: 118, y: 368 }
const 武器價格_offset = { x: 216, y: 396 }
const 武器搜尋_offset = { x: 220, y: 637 }
const firstItemOffset = { x: 950, y: 230 }
const buyButtonOffset = { x: 950, y: 750 }
const completeOffset = { x: 920, y: 120 }
const recievedButtonOffset = { x: 970, y: 170 }
const 頁碼左上_offset = { x: 619, y: 156 }
const 頁碼右下_offset = { x: 668, y: 176 }

// 分解欄位的按鈕的座標
const extractOpenOffset = { x: 485, y: 489 }
const confirmOffset = { x: 809, y: 510 }

// 收回道具的結果的狀態 mapping 表
const RECIEVE_ITEMS_STATUS_MAP = {
  SUCCESS: 'SUCCESS',
  NEED_CONTINUE: 'NEED_CONTINUE',
}
const MARKET_STATUS_MAP = {
  MARKET_MATCH_MAX_STATYS: 'MARKET_MATCH_MAX_STATYS',
  MARKET_NO_MORE_STATUS: 'MARKET_NO_MORE_STATUS',
}

// 得要是英文輸入才可以
async function englishMarket(x, y) {
  moveMouseByOffset(x, y, 市場搜尋_offset, { randomX: 2, randomY: 1 })
  await delay()
  clickMouse()
  await delay()
  keyIn('123')

  let is123 = await waitUntil({ x, y, message: '123', maxWait: 1500, place: 'market-search' })
  if (is123 == null) {
    keyIn(Array(5).fill('backspace'))
    await delay()

    rb.keyTap('shift')
    await delay()

    keyIn('123')
    is123 = await waitUntil({ x, y, message: '123', place: 'market-search' })

    if (is123 == null) return false

    return true
  }

  return true
}

async function goToSearch(x, y) {
  for (let i = 0; i < 2; i++) {
    moveMouseByOffset(x, y, 查詢_offset)
    await delay(50)
    clickMouse()
    await delay(50)
  }
}

async function clearMarket(x, y) {
  const 標題_offset = 防具_offset
  const 重置_offset = 防具重置_offset
  const 等級_offset = 防具等級_offset
  const 價格_offset = 防具價格_offset
  const 搜尋_offset = 防具搜尋_offset
  const price = 1
  const level = 300

  await setPriceAndLevel(x, y, { 標題_offset, 重置_offset, 等級_offset, 價格_offset, 搜尋_offset, price, level })
  await delay(3500)
}

async function 買防具({ x, y, boughtNumber, price, level, message = '開始買防具' } = {}) {
  console.log(`\x1b[1m\x1b[36m${message} \x1b[0m`)

  // 避免買到水晶的 nono function
  async function nonoFn(x, y, { offset1, offset2, page = '', forIndex = '' } = {}) {
    const nono = ['水晶', '未誰'].map((key) => new RegExp(key))
    const text = await getTextByOffset(x, y, offset1, offset2, 'chi_tra')

    return text === '' || nono.some((item) => text.match(new RegExp(item)))
  }

  // 檢查如果整頁都是水晶的話就直接跳頁
  async function justNextPage() {
    const bigOffset1 = { x: 340, y: 220 }
    const bigOffset2 = { x: 475, y: 700 }

    const text = await getTextByOffset(x, y, bigOffset1, bigOffset2, 'chi_tra')
    const 水晶count = text.match(/水晶/g)?.length || 0
    return 水晶count === 9
  }

  return buyByOffset({
    x,
    y,
    price,
    level,
    標題_offset: 防具_offset,
    重置_offset: 防具重置_offset,
    等級_offset: 防具等級_offset,
    價格_offset: 防具價格_offset,
    搜尋_offset: 防具搜尋_offset,
    justNextPage,
    nonoFn,
    boughtNumber,
  })
}
async function 買武器({ x, y, boughtNumber, price, level, message = '開始買武器' } = {}) {
  console.log(`\x1b[1m\x1b[36m${message} \x1b[0m`)

  return buyByOffset({
    x,
    y,
    price,
    level,
    標題_offset: 武器_offset,
    重置_offset: 武器重置_offset,
    等級_offset: 武器等級_offset,
    價格_offset: 武器價格_offset,
    搜尋_offset: 武器搜尋_offset,
    boughtNumber,
  })
}

async function setPriceAndLevel(x, y, config) {
  const { 標題_offset, 重置_offset, 等級_offset, 價格_offset, 搜尋_offset, price, level } = config

  moveMouseByOffset(x, y, 標題_offset)
  await delay(50)
  clickMouse()
  await delay(50)

  moveMouseByOffset(x, y, 重置_offset, { randomX: 2, randomY: 2 })
  await delay(50)
  clickMouse()
  await delay(50)

  moveMouseByOffset(x, y, 價格_offset, { randomX: 2, randomY: 2 })
  await delay(50)
  clickMouse()
  await delay(50)
  keyIn(String(price))
  await delay(50)

  moveMouseByOffset(x, y, 等級_offset, { randomX: 2, randomY: 2 })
  await delay(50)
  clickMouse()
  await delay(50)
  keyIn(String(level))
  await delay(50)

  moveMouseByOffset(x, y, 搜尋_offset, { randomX: 2, randomY: 2 })
  await delay(50)
  clickMouse()
  await delay(50)
  pressEnter()
}

async function buyByOffset(config) {
  const {
    x,
    y,

    標題_offset,
    重置_offset,
    等級_offset,
    價格_offset,
    搜尋_offset,
    price = 40000,
    level = 108,

    justNextPage = () => false,
    nonoFn = async (x, y) => !(await checkPage(x, y)),

    boughtNumber: preBoughtNumber = 0,
  } = config

  // 點擊查詢的 tab
  await goToSearch(x, y)

  // 設定查詢的資訊 + 開始查詢
  await setPriceAndLevel(x, y, { 標題_offset, 重置_offset, 等級_offset, 價格_offset, 搜尋_offset, price, level })

  await delay()

  // 等「正在搜尋中」出現，如果有的話等他消失
  console.log(`\x1b[1m\x1b[36m${'等「正在搜尋中」出現，如果有的話等他消失'} \x1b[0m`)
  const has正在搜尋中 = await waitUntil({ x, y, message: '正在', maxWait: 2 * 1000, place: ['正在搜尋中'] })
  if (has正在搜尋中 != null) {
    console.log('有出現「正在搜尋中」，等他消失')
    await waitUntil({ x, y, message: '正在', maxWait: 60 * 1000, place: ['center'], waitDissapear: true })
    console.log('> 「正在搜尋中」已消失')
  } else {
    console.log('沒有出現「正在搜尋中」')
  }

  // 等待查詢結果
  await Promise.race([
    waitUntil({
      x,
      y,
      message: [['搜尋結果'], ['查無此道具。']],
      maxWait: 10 * 1000,
      place: ['result', 'center'],
    }),
  ])

  await delay()

  // 沒資料的話
  if (!(await checkPage(x, y))) {
    console.log('沒有頁碼!')
    return { boughtNumber: preBoughtNumber, status: '當前類別沒有東西了' }
  }

  // 在特定條件下購買東西
  const { totalBuy: boughtNumber, status } = await buyWithNoNo(x, y, {
    nonoFn,
    justNextPage,
    totalBuy: preBoughtNumber,
  })
  console.log(`\x1b[32m 總共買了 ${boughtNumber} 個! \x1b[0m`)
  return { boughtNumber, status }
}

async function getCurrentPage(x, y) {
  return getTextByOffset(x, y, 頁碼左上_offset, 頁碼右下_offset)
}
async function checkPage(x, y) {
  const pageText = await getCurrentPage(x, y)

  if (!/\d+\/?\d+/.test(pageText)) return null
  if (pageText === '0/0') return null

  return true
}

async function recieveItems(x, y, totalBuy) {
  if (totalBuy === 0) {
    console.log('沒有買東西，所以不用領取')
    return { recieveStatus: RECIEVE_ITEMS_STATUS_MAP.SUCCESS }
  }

  // TODO(flyc): 這個動作是? 先註解起來吧
  // pressEnter()
  // await delay()

  // move to complete button
  moveMouseByOffset(x, y, completeOffset)
  await delay()
  clickMouse()
  await delay()

  // move to accept all recieved items
  moveMouseByOffset(x, y, recievedButtonOffset)
  await delay()
  clickMouse()
  await delay()
  pressEnter()

  let has已經結束 = null

  // 有時候會出現明明東西還沒有領完，但領取的過程自己中斷的情況
  // 所以需要判斷「領取中」的字樣消失的時候，是真的結束還是其實是 bug

  console.log(`\x1b[1m\x1b[36m${'檢查有沒有出現領取中'} \x1b[0m`)
  let has領取中 = await waitUntil({
    x,
    y,
    place: ['領取中'],
    message: ['全導說'], // 「領取」會被判斷成這個東西..
    maxWait: 1500,
  })

  if (has領取中 == null) {
    console.log('畫面沒有出現「領取中」')
    console.log(`\x1b[1m\x1b[36m${'檢查是不是因為已經領完了'} \x1b[0m`)
    has已經結束 = await waitUntil({
      x,
      y,
      message: ['已完成', '只能持有', '空間不足', '不足'],
      maxWait: 3 * 1000,
    })
    if (has已經結束 != null) {
      console.log('已經領取完成!')
      pressEnter()
      await delay()

      // 判斷是什麼原因完成的
      return _checkRecieveStatus(has已經結束)
    }

    console.log(`\x1b[1m\x1b[31m${'畫面沒有出現領取中，也沒有完成，卡住了! 直接重新嘗試看看'} \x1b[0m`)
    return await recieveItems(x, y, totalBuy)
  }

  console.log('目前正在領取中, 等待領取中的字樣消失')
  has領取中 = await waitUntil({
    x,
    y,
    place: ['領取中'],
    message: ['全導說'], // 「領取」會被判斷成這個東西..
    maxWait: 120 * 1000, // 這個可以改成依照買的數量做動態變動? 之前 10 個的話是 15 秒左右
    waitDissapear: true,
  })

  console.log('領取中的字樣消失了')
  console.log(`\x1b[1m\x1b[36m${'檢查是消失還是完成'} \x1b[0m`)
  has已經結束 = await waitUntil({
    x,
    y,
    message: ['已完成', '只能持有', '空間不足', '不足'],
    maxWait: 3 * 1000,
  })
  if (has已經結束 == null) {
    console.log(`\x1b[1m\x1b[31m${'沒有領取中的字樣, 但也沒有完成的字樣，判斷是自己中斷了，重新開始一次！'} \x1b[0m`)
    return await recieveItems(x, y, totalBuy)
  }

  pressEnter()
  await delay()

  return _checkRecieveStatus(has已經結束)

  function _checkRecieveStatus(has已經結束) {
    return has已經結束.foundIndex === 0 ? RECIEVE_ITEMS_STATUS_MAP.SUCCESS : RECIEVE_ITEMS_STATUS_MAP.NEED_CONTINUE
  }
}

async function buy(x, y, offset = firstItemOffset) {
  moveMouseByOffset(x, y, offset)
  await delay()
  clickMouse()
  await delay()

  // click buy button
  moveMouseByOffset(x, y, buyButtonOffset)
  await delay()
  clickMouse()
  await delay()

  pressEnter()
  const { index: foundIndex } =
    (await waitUntil({
      x,
      y,
      message: ['成功', '不足', '不存在'],
      maxWait: 10 * 1000,
    })) || {}
  const isNotEnough = foundIndex === 1 // '不足' 的 index
  const notExist = foundIndex === 2 // '不存在' 的 index

  pressEnter()
  await delay()

  return isNotEnough
    ? { status: '不足' }
    : notExist
      ? { status: '不存在' }
      : foundIndex == null
        ? { status: '等待超時' }
        : { status: '成功' }
}

/**
 * @description
 * nonoFn: 回傳 true 的時候，不要買, 反之要買
 * justNextPage: 回傳 true 的時候，直接跳下一夜
 * */
async function buyWithNoNo(
  x,
  y,
  { nonoFn = () => Promise.resolve(false), justNextPage = () => Promise.resolve(false), totalBuy = 0 }
) {
  await goNextPage(x, y, { justMove: true })

  const firstItem左上offset = { x: 349, y: 220 }
  const firstItem右下offset = { x: 448, y: 251 }

  let page = null
  let previousPage = null

  for (let i = 0; i < 20; i++) {
    page = await getCurrentPage(x, y)

    if (await justNextPage(x, y)) {
      console.log(`\x1b[32m${'達成條件! 可以直接跳下一頁面'} \x1b[0m`)
    } else {
      // region check single page
      let offset1 = firstItem左上offset
      let offset2 = firstItem右下offset

      for (let j = 0; j < 9; j++) {
        // 沒 nono, 就 buybuy
        if (!(await nonoFn(x, y, { offset1, offset2, page, forIndex: j }))) {
          const { status } = await buy(x, y, { ...offset1, y: offset1.y + 5 })
          switch (status) {
            case '不足':
              console.log('購買空間不夠了')
              return { totalBuy, status: '購買空間不夠了' }

            case '不存在':
              console.log(`\x1b[31m${'剛剛要買的東西沒買到，不見惹'} \x1b[0m`)
              totalBuy-- // 後面怎樣都會++, 所以這邊先--
              break

            case '等待超時':
              console.log(`\x1b[1m\x1b[31m${'購買的等待超時了，我也不知道該怎麼辦其實, 後面應該會買成功.. 吧'} \x1b[0m`)
              break
          }

          j-- // 卡在同一格用
          totalBuy++
          console.log(`目前買了 ${totalBuy} 個`)
        } else {
          offset1 = { x: offset1.x, y: offset1.y + 55 }
          offset2 = { x: offset2.x, y: offset2.y + 55 }
        }
      }
      // endregion check single page
    }

    // 檢查到最後一頁了沒
    if (checkPage() != null) {
      // 先用 / 的方式判斷
      const [c, t] = page.split('/')
      if (c === t) break

      // 不行的話用回歸判斷
      const reverse = page.split('').reverse().join('')
      if (page === reverse) break

      // 最後就用與之前相同與否的方式判斷吧
      if (page === previousPage) break
    }

    console.log('還沒到底，換頁後繼續')
    previousPage = page
    await goNextPage(x, y)
    await delay()
  }

  return { totalBuy, status: '當前類別沒有東西了' }

  async function goNextPage(x, y, { justMove = false } = {}) {
    moveMouseByOffset(x, y, { x: 687, y: 171 }, { randomX: 1, randomY: 1 })
    await delay()

    if (justMove) return

    clickMouse()
    await delay()
  }
}

const 離開市場_offset = { x: 977, y: 56 }

async function marketAndExtract({ startWith } = {}) {
  const { x, y } = getApplicationInfo()

  if (startWith === 'town') {
    const townName = await waitUntil({ x, y, maxWait: 10 * 1000, message: '梅斯特', place: 'town' })
    if (townName == null) return void console.log('要先到鎮上喔')

    keyIn([']', ...Array(4).fill('down')])
    rb.keyTap('enter')
  } else if (startWith === 'market') {
    console.log('直接從市場開始')
  }

  const inMarket = await waitUntil({
    x,
    y,
    maxWait: 10 * 1000,
    message: '完全一致',
    place: 'market-title',
  })
  if (inMarket == null) return void console.log('到不了市場。。。')

  const marketResult = await market()

  moveMouseByOffset(x, y, 離開市場_offset)
  await delay()
  clickMouse()
  await delay()

  // 回到了城鎮，開始分解
  await extract()

  console.log('結束囉!')
  return marketResult // for recursive stuff
}

// 進入城鎮
// 讓右上角的小地圖包含地圖名稱一起顯示
// 把包包移動到切齊地圖名稱下緣、剛好遮住小地圖
// 然後把 extract function 的座標設定為第一個想要分解的物品  let row = paramRow // 第一個要被分解的物品的座標
export async function extract({ paramRow = 6, paramColumn = 5 } = {}) {
  const { x, y } = getApplicationInfo()
  const confirmColor = {
    ax: x + confirmOffset.x,
    ay: y + confirmOffset.y,
    color: 'ddfffff',
  }

  // 等待畫面中 place: town 的地方的文字變成 梅斯特 的意思
  const townName = await waitUntil({ x, y, maxWait: 60 * 1000, message: '梅斯特', place: 'town' })
  if (townName == null) return void console.log('這裡是哪裡，我要去鎮上')

  // 開啟物品欄 -> 點選裝備
  rb.keyTap('i')

  await delay()

  moveMouseByOffset(x, y, 裝備_offset, { randomX: 2, randomY: 2 })

  await delay()

  clickMouse()

  await delay()

  moveMouseByOffset(x, y, 背包整理_offest, { randomX: 2, randomY: 2 })
  clickMouse()

  await delay()

  moveMouseByOffset(x, y, 背包向上_offest, { randomX: 2, randomY: 2 })
  clickMouse()

  await delay()

  // 設定好第一個座標
  let row = paramRow
  let column = paramColumn // 第一個要被分解的物品的座標
  const eachBlockSize = 42
  const firstCoordinate = { x: 30, y: 155 }

  // 開啟分解框
  moveMouseByOffset(x, y, extractOpenOffset, { randomX: 2, randomY: 2 })
  await delay()
  clickMouse()
  await delay()

  let offset = null
  let everHas = false // 用於檢查如果已經檢查過有東西在上面了，就不去做再次檢查
  for (let index = 1; index <= Infinity; index++) {
    offset = _getOffsetByCoordinate(row, column)
    moveMouseByOffset(x, y, offset, { randomX: 3, randomY: 3 })
    await delay(50)
    clickRightMouse()
    await delay(50)

    // 檢查是不是不能分解的東西、會跳出一個框的那種，會自動把他按掉
    _checkHasExtraHint()

    if (index % 5 === 0 && !everHas) {
      // 檢查是不是做了點擊的動作之後，仍舊符合關閉的條件
      // 也是要先移動去空白的地方，不然會被情詳遮到
      moveMouseByOffset(x, y, { x: confirmOffset.x + 50, y: confirmOffset.y + 50 }, { randomX: 5, randomY: 2 })
      await delay()
      if (rb.getPixelColor(confirmColor.ax - 5, confirmColor.ay - 5) !== 'ffffff') {
        console.log('已經沒了!')
        break
      } else {
        everHas = true
      }
    }

    const { row: nRow, column: nColumn } = _toNextRowColumn(row, column)
    row = nRow
    column = nColumn
    offset = _getOffsetByCoordinate(row, column)

    const maxNumberOfExtractOnce = 30
    if (index % maxNumberOfExtractOnce === 0) {
      // 先移到空白的地方, 避免那些道具詳情影響畫面
      moveMouseByOffset(x, y, { x: confirmOffset.x + 50, y: confirmOffset.y + 50 }, { randomX: 5, randomY: 2 })
      await delay()

      moveMouseByOffset(x, y, confirmOffset, { randomX: 5, randomY: 2 })
      await delay()

      // 檢查顏色
      const currentColor = rb.getPixelColor(confirmColor.ax - 5, confirmColor.ay - 5)
      if (currentColor !== 'ffffff') {
        console.log('已經沒了!')
        break
      }

      clickMouse()
      await delay()
      pressEnter()
      await delay()

      await waitUntil({
        x,
        y,
        message: '完成', // 這邊真的有點不準確..
        maxWait: 10 * 1000,
        interval: 200,
        place: 'extract',
      })

      pressEnter()
      await delay()

      // 為了把東西全部往上放，所以要先把框關掉
      await delay()
      keyIn(['escape'])
      await delay()

      // 把東西全部往上放
      moveMouseByOffset(x, y, 背包整理_offest, { randomX: 2, randomY: 2 })
      await delay()
      clickMouse()
      await delay()
      moveMouseByOffset(x, y, 背包向上_offest, { randomX: 2, randomY: 2 })
      await delay()
      clickMouse()
      await delay()

      // 因為物品往上了，所以座標也要重新開始
      row = paramRow
      column = paramColumn

      // 再重新把分解框叫出來
      moveMouseByOffset(x, y, extractOpenOffset, { randomX: 2, randomY: 2 })
      await delay()
      clickMouse()
      await delay()

      everHas = false
    }
  }

  // 關閉分解和裝備視窗
  keyIn(Array(2).fill('escape'))

  function _toNextRowColumn(row, coloumn) {
    let returnRow = row
    let returnColumn = coloumn

    returnColumn = coloumn % 4 === 0 ? returnColumn - 3 : returnColumn + 1

    if (column % 4 === 0) {
      returnRow++
    }
    if (returnRow % 9 === 0) {
      returnRow = 1
      returnColumn += 4
    }

    return {
      row: returnRow,
      column: returnColumn,
    }
  }

  function _getOffsetByCoordinate(row, column) {
    const offset = {
      x: firstCoordinate.x + (column - 1) * eachBlockSize,
      y: firstCoordinate.y + (row - 1) * eachBlockSize,
    }
    return offset
  }

  function _checkHasExtraHint() {
    const hintOkPoint = { x: x + 791, y: y + 444, color: '99dd00' }
    const hintOkColor = rb.getPixelColor(hintOkPoint.x, hintOkPoint.y)
    const hasMessage = hintOkColor === hintOkPoint.color
    if (hasMessage) pressEnter()
  }
}

export async function market() {
  const { x, y } = getApplicationInfo()

  // 為了可以正常輸入數字，所以要先把使用者的輸入法切換到英文
  if (!(await englishMarket(x, y))) return void console.log('記得切換到英文喔')
  pressEnter()
  delay(50)

  // 滑鼠移動到搜尋框
  await goToSearch(x, y)

  // 透過搜尋不存在的商品來清空畫面，避免買到不需要的東西
  await clearMarket(x, y)

  let res = null
  let status = null
  let boughtNumber = 0

  res = await 買防具({ x, y, boughtNumber, price: 100000, level: 130, message: '開始買 130 防具' })
  boughtNumber = res.boughtNumber
  status = res.status
  if (status === '購買空間不夠了') {
    await recieveItems(x, y)
    return { status: MARKET_STATUS_MAP.MARKET_MATCH_MAX_STATYS }
  }
  console.log('因為怕沒買到東西導致太快結束，所以要先等個 2 秒')
  console.log('')
  await delay(2000)

  res = await 買武器({ x, y, boughtNumber, price: 100000, level: 130, message: '開始買 130 武器' })
  boughtNumber = res.boughtNumber
  status = res.status
  if (status === '購買空間不夠了') {
    await recieveItems(x, y)
    return { status: MARKET_STATUS_MAP.MARKET_MATCH_MAX_STATYS }
  }
  console.log('因為怕沒買到東西導致太快結束，所以要先等個 2 秒')
  console.log('')
  await delay(2000)

  res = await 買防具({ x, y, boughtNumber, price: 70000, message: '開始買 108 防具' })
  boughtNumber = res.boughtNumber
  status = res.status
  if (status === '購買空間不夠了') {
    await recieveItems(x, y)
    return { status: MARKET_STATUS_MAP.MARKET_MATCH_MAX_STATYS }
  }
  console.log('因為怕沒買到東西導致太快結束，所以要先等個 2 秒')
  console.log('')
  await delay(2000)

  res = await 買武器({ x, y, boughtNumber, price: 70000, message: '開始買 108 武器' })
  boughtNumber = res.boughtNumber
  status = res.status
  if (status === '購買空間不夠了') {
    await recieveItems(x, y)
    return { status: MARKET_STATUS_MAP.MARKET_MATCH_MAX_STATYS }
  }
  console.log('因為怕沒買到東西導致太快結束，所以要先等個 2 秒')
  console.log('')
  await delay(2000)

  pressEnter()

  const recieveStatus = await recieveItems(x, y, boughtNumber)
  if (recieveStatus !== RECIEVE_ITEMS_STATUS_MAP.SUCCESS) {
    console.log('可能是包包滿了或其他原因造成的停止，要繼續買!')
    return { status: recieveStatus }
  }

  console.log(`\x1b[1m\x1b[32m${'市場結束囉!'} \x1b[0m`)

  return { status: MARKET_STATUS_MAP.MARKET_NO_MORE_STATUS }
}

export async function money({ startWith = 'town' } = {}) {
  const { status } = await marketAndExtract({ startWith })
  if (status !== MARKET_STATUS_MAP.MARKET_NO_MORE_STATUS) await money({ startWith })
}
