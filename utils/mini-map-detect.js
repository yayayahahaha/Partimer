const ffi = require('ffi-napi')

// 載入 user32.dll 和 gdi32.dll 函數庫
const user32 = new ffi.Library('user32', {
  GetDC: ['int', ['int']],
  ReleaseDC: ['int', ['int', 'int']],
})
const gdi32 = new ffi.Library('gdi32', {
  GetPixel: ['int', ['int', 'int', 'int']],
})

// 定義函數：檢查指定區域是否包含指定顏色碼
function checkColorInRegion(left, top, right, bottom, color) {
  const hdc = user32.GetDC(0) // 獲取螢幕的設備內容
  let isColorPresent = false

  // 遍歷指定區域的每一個像素，檢查其顏色是否與指定顏色相符
  for (let x = left; x <= right; x++) {
    for (let y = top; y <= bottom; y++) {
      const pixel = gdi32.GetPixel(hdc, x, y) // 獲取像素顏色
      if (pixel === color) {
        isColorPresent = true
        break
      }
    }
    if (isColorPresent) break
  }

  user32.ReleaseDC(0, hdc) // 釋放設備內容

  return isColorPresent
}

// 調用函數進行圖像辨識檢測
const left = 100 // 指定區域的左上角 x 座標
const top = 100 // 指定區域的左上角 y 座標
const right = 200 // 指定區域的右下角 x 座標
const bottom = 200 // 指定區域的右下角 y 座標
const color = 0xff0000 // 指定的顏色碼（這裡是紅色）

const result = checkColorInRegion(left, top, right, bottom, color)
console.log('Is color present in the specified region?', result)
