import env from 'std-env'
import { Consola, BasicReporter, FancyReporter, JSONReporter, WinstonReporter, LogLevel } from '.'

function createConsola () {
  // Log level
  let level = env.debug ? 4 : 3
  if (process.env.CONSOLA_LEVEL) {
    level = parseInt(process.env.CONSOLA_LEVEL) || level
  }

  // Create new consola instance
  const consola = new Consola({
    level,
    reporters: [
      (env.ci || env.test)
        ? new BasicReporter()
        : new FancyReporter()
    ]
  })

  // Expose constructors
  consola.Consola = Consola
  consola.BasicReporter = BasicReporter
  consola.FancyReporter = FancyReporter
  consola.JSONReporter = JSONReporter
  consola.WinstonReporter = WinstonReporter
  consola.LogLevel = LogLevel

  return consola
}

if (!global.consola) {
  global.consola = createConsola()
}

export default global.consola
