import { beforeStart } from './utils/others.js'
import { test } from './utils/thunder.js'

async function startTest() {
  await beforeStart(2)

  test()
}
startTest()
