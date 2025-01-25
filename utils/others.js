// TODO(flyc): 可以更快新增想要確認的字的 waitUntil 的方法

// 1366 * 768
import { getForegroundWindowRect, getForegroundWindowTitle } from './application-control.js'
import { pressEnter } from './keyboard-action.js'
import { clickMouse, moveMouseWithBezier, getCurrentCoordinate } from './mouse-control.js'
import rb from 'robotjs'
import { captureScreenAndConvertToJimp, recognizeText } from './text.js'
import { extract, market } from './money-utils.js'

function delay(milSec = 200, randomSec = 100) {
  return new Promise((r) => {
    setTimeout(r, milSec + Math.floor(Math.random() * randomSec))
  })
}
export function _keyIn(str) {
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    rb.keyTap(char)
  }
}

const 搜尋結果左上_offset = { x: 285, y: 155 }
const 搜尋結果右下_offset = { x: 355, y: 180 }

const 中央訊息左上_offset = { x: 435, y: 414 }
const 中央訊息右下_offset = { x: 583, y: 437 }

const 正在搜尋中訊息左上_offset = { x: 442, y: 382 }
const 正在搜尋中訊息右下_offset = { x: 598, y: 416 }

const 領取中訊息左上_offset = { x: 405, y: 366 }
const 領取中訊息右下_offset = { x: 600, y: 393 }

const 分解訊息左上_offset = { x: 651, y: 392 }
const 分解訊息右下_offset = { x: 727, y: 420 }
const 離開_offset = { x: 977, y: 56 }
const 鎮名左上_Offset = { x: 135, y: 60 }
const 鎮名右下_Offset = { x: 188, y: 80 }

const 市場標題左上_Offset = { x: 342, y: 77 }
const 市場標題右下_Offset = { x: 398, y: 98 }

const 市場搜尋左上_offset = { x: 100, y: 81 }
const 市場搜尋右下_offset = { x: 250, y: 96 }

export async function marketAndExtract({ startWith } = {}) {
  const { x, y } = getApplicationInfo()

  if (startWith === 'town') {
    const townName = await waitUntil({ x, y, maxWait: 10 * 1000, message: '梅斯特', place: 'town' })
    if (townName == null) return void console.log('要先到鎮上喔')

    _keyIn([']', ...Array(4).fill('down')])
    pressEnter()
  } else if (startWith === 'market') {
    console.log('直接從市場開始')
  }

  const inMarket = await waitUntil({
    x,
    y,
    maxWait: 10 * 1000,
    message: '完全一致',
    place: 'market-title',
    test: true,
  })
  if (inMarket == null) return void console.log('到不了市場。。。')

  const marketResult = await market()

  _moveMouseByOffset(x, y, 離開_offset)
  await delay()
  clickMouse()
  await delay()

  // 回到了城鎮，開始分解
  await extract()

  console.log('結束囉!')
  return marketResult // for recursive stuff
}

function get領取中Message(x, y) {
  return getTextByOffset(x, y, 領取中訊息左上_offset, 領取中訊息右下_offset, 'chi_tra')
}

function get正在搜尋中Message(x, y) {
  return getTextByOffset(x, y, 正在搜尋中訊息左上_offset, 正在搜尋中訊息右下_offset, 'chi_tra')
}

function getCenterMessage(x, y) {
  return getTextByOffset(x, y, 中央訊息左上_offset, 中央訊息右下_offset, 'chi_tra')
}

function getExtractMessage(x, y) {
  return getTextByOffset(x, y, 分解訊息左上_offset, 分解訊息右下_offset, 'chi_tra')
}

function getTownName(x, y) {
  return getTextByOffset(x, y, 鎮名左上_Offset, 鎮名右下_Offset, 'chi_tra')
}

function getMarketTitle(x, y) {
  return getTextByOffset(x, y, 市場標題左上_Offset, 市場標題右下_Offset, 'chi_tra')
}

function getMarketSearch(x, y) {
  return getTextByOffset(x, y, 市場搜尋左上_offset, 市場搜尋右下_offset)
}

function getMarketResult(x, y) {
  return getTextByOffset(x, y, 搜尋結果左上_offset, 搜尋結果右下_offset, 'chi_tra')
}

export async function getTextByOffset(x, y, startOffset, endOffset, language = 'eng') {
  const setting = {
    x: x + startOffset.x,
    y: y + startOffset.y,
    width: endOffset.x - startOffset.x,
    height: endOffset.y - startOffset.y,
    noDefault: true,
  }
  const imgBuffer = await captureScreenAndConvertToJimp(setting)
  const recognizedText = await recognizeText(imgBuffer, language)
  return recognizedText.replace(/\s+/g, '')
}

// 開始前的倒數
async function beforeStart(sec = 5) {
  console.log(`Start in ${sec} sec`)

  for (let i = 1; i < sec + 1; i++) {
    await delay(1000, 0)
    sec - i && console.log(sec - i)
  }
}

export function getApplicationInfo(showConsole = true) {
  const applicationTitle = getForegroundWindowTitle()
  const { left: x, top: y, right: endX, bottom: endY } = getForegroundWindowRect()
  const width = endX - x
  const height = endY - y

  if (showConsole) {
    console.log(`Foreground application title: ${applicationTitle}`)
    console.log(`Application cordinatins: x: ${x}, y: ${y}, endX: ${endX}, endY: ${endY}`)
  }

  return { applicationTitle, x, y, endX, endY, width, height }
}

// TODO 這個蠻好用的，可以改寫放到其他地方試試看
// 覺得需要有一個 instance 去處理的感覺，不然會有點亂
export async function waitUntil({
  x,
  y,
  message,
  maxWait = 5000,
  interval = 100,
  place = 'center',
  waitDissapear = false,
  test = false,
} = {}) {
  let stopTry = false

  let delayResolve = null

  return Promise.race([
    // max wait timer
    new Promise((resolve) => {
      const timer = setTimeout(() => {
        stopTry = true
        return null
      }, maxWait)

      delayResolve = function () {
        clearTimeout(timer)
        resolve(null)
      }
    }),

    // retry function
    new Promise((resolve) => {
      checkMessage()

      async function checkMessage() {
        if (!Array.isArray(message)) {
          // TODO 改寫法
          message = [[message]]
        } else if (!message.every((m) => Array.isArray(m))) {
          message = [message]
        }

        if (!Array.isArray(place)) {
          // TODO 改寫法
          place = [place]
        }

        const fList = place.map((place, i) => {
          switch (place) {
            case '領取中':
              return { fn: get領取中Message, message: message[i] || null }

            case '正在搜尋中':
              return { fn: get正在搜尋中Message, message: message[i] || null }

            case 'center':
              return { fn: getCenterMessage, message: message[i] || null }

            case 'extract':
              return { fn: getExtractMessage, message: message[i] || null }

            case 'town':
              return { fn: getTownName, message: message[i] || null }

            case 'market-title':
              return { fn: getMarketTitle, message: message[i] || null }

            case 'market-search':
              return { fn: getMarketSearch, message: message[i] || null }

            case 'result':
              return { fn: getMarketResult, message: message[i] || null }
          }
        })

        let foundIndex = -1
        let found = null
        for (let i = 0; i < fList.length; i++) {
          const { fn, message } = fList[i]
          const imgText = await fn(x, y)
          let messageList = message

          if (!Array.isArray(messageList)) messageList = [messageList]

          foundIndex = messageList.findIndex((str) => imgText.match(new RegExp(str)))
          found = !!~foundIndex

          test && console.log('waitUntil:', JSON.stringify(imgText), JSON.stringify(message))
          test && console.log(`found: ${found}, foundIndex: ${foundIndex}`)

          if (waitDissapear) {
            if (!found) break
          } else {
            if (found) break
          }
        }
        if (waitDissapear) {
          if (!found) {
            resolve({ success: true, dissapear: true })

            // 避免 nodejs 卡住
            return void setTimeout(delayResolve, 100)
          }
        } else {
          if (found) {
            resolve({ index: foundIndex })

            // 避免 nodejs 卡住
            return void setTimeout(delayResolve, 100)
          }
        }

        if (stopTry) return resolve(null)

        return setTimeout(checkMessage, interval)
      }
    }),
  ])
}

export function _moveMouseByOffset(x, y, offestPayload, { steps = 5000, randomX = 10, randomY = 10 } = {}) {
  moveMouseWithBezier(
    undefined,
    null,
    [
      Math.round(Math.random() * randomX) + x + offestPayload.x,
      Math.round(Math.random() * randomY) + y + offestPayload.y,
    ],
    steps
  )
}

function displayMousePosition() {
  const { x, y, applicationTitle } = getApplicationInfo()

  const [ax, ay] = getCurrentCoordinate()
  console.log('applicationTitle:', applicationTitle)
  console.log('absolute position: ', ax, ay)
  console.log('application position: ', x, y)
  // console.log('color: ', rb.getPixelColor(997, 543))
  console.log('color: ', rb.getPixelColor(ax - 5, ay - 5))
  console.log('offset position: ', ax - x, ay - y)
  console.log()

  setTimeout(displayMousePosition, 1000)
}

export { delay, beforeStart, displayMousePosition }
