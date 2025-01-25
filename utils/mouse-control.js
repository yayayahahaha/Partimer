import ffi from 'ffi-napi'

const user32 = new ffi.Library('user32', {
  SetCursorPos: ['bool', ['long', 'long']],
  GetCursorPos: ['bool', ['pointer']],
  mouse_event: ['void', ['uint32', 'uint32', 'int32', 'int32', 'uint32']],
})

function moveMouse(x, y) {
  user32.SetCursorPos(x, y)
}

function clickRightMouse() {
  const MOUSEEVENTF_RIGHTDOWN = 0x0008
  const MOUSEEVENTF_RIGHTUP = 0x0010

  user32.mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
  user32.mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
}

function clickMouse() {
  const MOUSEEVENTF_LEFTDOWN = 0x02
  const MOUSEEVENTF_LEFTUP = 0x04
  user32.mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
  user32.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
}

function getCurrentCoordinate() {
  // 定義一個指針
  const point = Buffer.alloc(8) // 因為座標是 4 bytes 整數型別的 x 和 y 值，所以總共 8 bytes

  user32.GetCursorPos(point)
  const x = point.readInt32LE(0)
  const y = point.readInt32LE(4)
  return [x, y]
}

// 模擬滑鼠移動
// TODO update parameters to object-config type
function moveMouseWithBezier(
  startCoordinate = getCurrentCoordinate(),
  oriControlCoordinate = null,
  endCoordinate = [],
  steps = 5000
) {
  let controlCoordinate = oriControlCoordinate
  if (controlCoordinate == null) {
    // 如果是 null 的話做一個 random 給他?
    controlCoordinate = [
      Math.round((startCoordinate[0] + endCoordinate[0]) / 2) + Math.round(Math.random() * 100),
      Math.round((startCoordinate[1] + endCoordinate[1]) / 2) + Math.round(Math.random() * 100),
    ]
  }

  for (let i = 0; i <= steps; i++) {
    const pos = _bezier(startCoordinate, controlCoordinate, endCoordinate, i / steps)
    user32.SetCursorPos(Math.round(pos[0]), Math.round(pos[1]))
  }

  // 定義貝茲曲線函數
  function _bezier(start, control, end, t) {
    const tx = 1 - t
    const tx2 = tx * tx
    const t2 = t * t
    return [
      start[0] * tx2 + 2 * control[0] * tx * t + end[0] * t2,
      start[1] * tx2 + 2 * control[1] * tx * t + end[1] * t2,
    ]
  }
}

export { getCurrentCoordinate, moveMouseWithBezier, moveMouse, clickMouse, clickRightMouse }
