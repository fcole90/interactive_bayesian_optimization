// Main entrypoint
import { ui } from './legacy/libs/ui.js'


export const main = {
  bootstrap: () => {
    console.log('Bootstrapping app')
    const app = new ui.Application()
    app.exec()
  },
}


