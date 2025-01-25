import robot from 'robotjs'
import Jimp from 'jimp'
import { createWorker } from 'tesseract.js'
import { beforeStart, getApplicationInfo } from './others.js'

// TODO 這個可以和 screen 那邊的做整合
// 擷取螢幕截圖並轉換為 Jimp 圖像
export async function captureScreenAndConvertToJimp(config = {}) {
  const noDefault = config.noDefault == null ? false : true
  const defaultSetting = noDefault ? {} : getApplicationInfo()
  const { x, y, width, height } = Object.assign({}, defaultSetting, config)

  const screenshot = robot.screen.capture(x, y, width, height)

  // 這個東西居然只在 windows 有效我的天, 不過目前這樣出來的會有顏色的問題
  return new Promise((resolve) => {
    const image = new Jimp(width, height)
    let pos = 0
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      image.bitmap.data[idx + 2] = screenshot.image.readUInt8(pos++)
      image.bitmap.data[idx + 1] = screenshot.image.readUInt8(pos++)
      image.bitmap.data[idx + 0] = screenshot.image.readUInt8(pos++)
      image.bitmap.data[idx + 3] = screenshot.image.readUInt8(pos++)
    })

    image
      .quality(100) // 銳利化
      .greyscale() // 轉為灰階
      .contrast(0.7) // 提高對比度
      .invert() // 反轉顏色

    // image.write(`checkImg/${Date.now()}.png`)
    image.write(`text-text.png`)

    resolve(image.getBufferAsync(Jimp.AUTO))
  })

  // 這個雖然 widnow 和 mac 都可以，但太慢了, 還沒有去找找看有沒有其他方式
  // https://stackoverflow.com/questions/43881571/how-to-save-binary-buffer-to-png-file-in-nodejs/43881698#43881698
}

// 使用 Tesseract.js 辨識圖像中的文字
export async function recognizeText(imageBuffer, language = 'eng') {
  // 設置引擎參數
  const defaultConfig = {
    lang: 'eng+chi_tra', // 要辨識的語言
    oem: 1, // OCR 引擎模式 (1 表示 Tesseract)
    psm: 0, // Page Segmentation Mode (3 表示單一行)
    // tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', // 字元白名單
    // tessedit_char_blacklist: '@#$%^&*()_+=-<>?/.,\'":;{}[]~`', // 字元黑名單
    // 更多參數可以參考 Tesseract.js 的文檔
  }

  const worker = await createWorker(language)
  // const worker = await createWorker('eng+chi_tra')
  // const worker = await createWorker(config)

  const {
    data: { text },
  } = await worker.recognize(imageBuffer)
  await worker.terminate()
  return text
}

// 主函式
async function main() {
  await beforeStart(3)

  try {
    // 擷取螢幕截圖並轉換為 Jimp 圖像
    console.time('imageBuffer')
    const imageBuffer = await captureScreenAndConvertToJimp()
    console.timeEnd('imageBuffer')

    // 使用 Tesseract.js 辨識圖像中的文字
    const recognizedText = await recognizeText(imageBuffer)
    return

    // 判斷是否包含特定文字
  } catch (error) {
    console.error('錯誤:', error)
  }
}

// main()
