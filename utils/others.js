// 1366 * 768
import { getForegroundWindowRect, getForegroundWindowTitle } from './application-control.js'
import { moveMouseWithBezier, getCurrentCoordinate } from './mouse-control.js'
import rb from 'robotjs'
import { captureScreenAndConvertToJimp, recognizeText } from './text.js'

export function delay(milSec = 200, randomSec = 100) {
  return new Promise((r) => {
    setTimeout(r, milSec + Math.floor(Math.random() * randomSec))
  })
}

export function keyIn(str) {
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    rb.keyTap(char)
  }
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
export async function beforeStart(sec = 5) {
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

export function moveMouseByOffset(x, y, offestPayload, { steps = 5000, randomX = 10, randomY = 10 } = {}) {
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

export function displayMousePosition() {
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
