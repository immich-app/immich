import Consola from './consola.js'
import BrowserReporter from './reporters/browser.js'
import { LogLevel } from './logLevels'

function createConsola () {
  const consola = new Consola({
    reporters: [
      new BrowserReporter()
    ]
  })

  // Expose constructors
  consola.Consola = Consola
  consola.LogLevel = LogLevel
  consola.BrowserReporter = BrowserReporter

  return consola
}

export default (typeof window !== 'undefined' && window.consola) || createConsola()
