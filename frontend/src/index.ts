// Main entrypoint
import { ui } from './legacy/libs/ui.js'

// Import jQuery globally
import './3rd/jquery/dist/jquery.js'
import * as std from './legacy/libs/std.js'

const tests = () => {
  console.log('Bootstrapping app')
  console.log('Type:', std.type(undefined))
  const d = new std.Dictionary<number>()

  const c = d['a']

  d.set('a', 1)
  console.log('d[\'a\']', d['a'])
  console.log('size:', [...d.keys()].length)
  console.log(std.len(d))
}


export const main = {
  bootstrap: () => {
    tests()
    const app = new ui.Application()
    app.exec()
  },
}


