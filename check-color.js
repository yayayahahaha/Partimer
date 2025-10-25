import rb from 'robotjs'
import { beforeStart, getApplicationInfo } from './utils/others.js'

await beforeStart(2)

const { x, y } = getApplicationInfo()

const offset = { x: 798, y: 521 }

const ox = x + offset.x
const oy = y + offset.y

console.log(rb.getPixelColor(ox, oy))
