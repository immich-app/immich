// This reporter is compatible with Winston 3
// https://github.com/winstonjs/winston

// eslint-disable-next-line
const _require = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require // bypass webpack

export default class WinstonReporter {
  constructor (logger) {
    if (logger && logger.log) {
      this.logger = logger
    } else {
      const winston = _require('winston')

      this.logger = winston.createLogger(Object.assign({
        level: 'info',
        format: winston.format.simple(),
        transports: [
          new winston.transports.Console()
        ]
      }, logger))
    }
  }

  log (logObj) {
    const args = [].concat(logObj.args)
    const arg0 = args.shift()

    this.logger.log({
      level: levels[logObj.level] || 'info',
      label: logObj.tag,
      message: arg0,
      args: args,
      timestamp: logObj.date.getTime() / 1000
    })
  }
}

const levels = {
  0: 'error',
  1: 'warn',
  2: 'info',
  3: 'verbose',
  4: 'debug',
  5: 'silly'
}
