// TODO(flyc): 可以更快新增想要確認的字的 waitUntil 的方法

import { getTextByOffset } from './others.js'

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

const 鎮名左上_Offset = { x: 135, y: 60 }
const 鎮名右下_Offset = { x: 188, y: 80 }
const 市場標題左上_Offset = { x: 342, y: 77 }
const 市場標題右下_Offset = { x: 398, y: 98 }
const 市場搜尋左上_offset = { x: 100, y: 81 }
const 市場搜尋右下_offset = { x: 250, y: 96 }

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
