import util from 'util'
import { parseStack } from '../utils/error'
import { writeStream } from '../utils/stream'
import { formatDate } from '../utils/date'

const DEFAULTS = {
  dateFormat: 'HH:mm:ss',
  formatOptions: {
    date: true,
    colors: false,
    compact: true
  }
}

const bracket = x => x ? `[${x}]` : ''

export default class BasicReporter {
  constructor (options) {
    this.options = Object.assign({}, DEFAULTS, options)
  }

  formatStack (stack) {
    return '  ' + parseStack(stack).join('\n  ')
  }

  formatArgs (args) {
    const _args = args.map(arg => {
      if (arg && typeof arg.stack === 'string') {
        return arg.message + '\n' + this.formatStack(arg.stack)
      }
      return arg
    })

    // Only supported with Node >= 10
    // https://nodejs.org/api/util.html#util_util_inspect_object_options
    if (typeof util.formatWithOptions === 'function') {
      return util.formatWithOptions(this.options.formatOptions, ..._args)
    } else {
      return util.format(..._args)
    }
  }

  formatDate (date) {
    return this.options.formatOptions.date ? formatDate(this.options.dateFormat, date) : ''
  }

  filterAndJoin (arr) {
    return arr.filter(x => x).join(' ')
  }

  formatLogObj (logObj) {
    const message = this.formatArgs(logObj.args)

    return this.filterAndJoin([
      bracket(logObj.type),
      bracket(logObj.tag),
      message
    ])
  }

  log (logObj, { async, stdout, stderr } = {}) {
    const line = this.formatLogObj(logObj, {
      width: stdout.columns || 0
    })

    return writeStream(
      line + '\n',
      logObj.level < 2 ? stderr : stdout,
      async ? 'async' : 'default'
    )
  }
}
