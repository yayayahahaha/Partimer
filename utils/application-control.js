import ffi from 'ffi-napi'

// 假設你要調用的Windows API函數定義如下
const user32 = new ffi.Library('user32', {
  GetForegroundWindow: ['long', []],
  GetWindowTextA: ['long', ['long', 'string', 'long']],
  GetWindowRect: ['bool', ['long', 'pointer']],
})

// 定義一個函數來獲取當前前景窗口的標題
function getForegroundWindowTitle() {
  const buf = Buffer.alloc(256)
  const handle = user32.GetForegroundWindow()
  user32.GetWindowTextA(handle, buf, 256)
  return buf.toString()
}

// 定義一個函數來獲取當前前景窗口的位置和大小
function getForegroundWindowRect() {
  const rect = Buffer.alloc(16) // RECT結構的大小為16個位元組
  const handle = user32.GetForegroundWindow()
  user32.GetWindowRect(handle, rect)
  return {
    left: rect.readInt32LE(0),
    top: rect.readInt32LE(4),
    right: rect.readInt32LE(8),
    bottom: rect.readInt32LE(12),
  }
}

export { getForegroundWindowTitle, getForegroundWindowRect }
