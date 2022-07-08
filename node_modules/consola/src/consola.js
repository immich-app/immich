import Types from './types.js'
import { isLogObj } from './utils/index.js'

let paused = false
const queue = []

class Consola {
  constructor (options = {}) {
    this._reporters = options.reporters || []
    this._types = options.types || Types
    this.level = options.level !== undefined ? options.level : 3
    this._defaults = options.defaults || {}
    this._async = options.async !== undefined ? options.async : undefined
    this._stdout = options.stdout
    this._stderr = options.stderr
    this._mockFn = options.mockFn
    this._throttle = options.throttle || 1000
    this._throttleMin = options.throttleMin || 5

    // Create logger functions for current instance
    for (const type in this._types) {
      const defaults = {
        type,
        ...this._types[type],
        ...this._defaults
      }
      this[type] = this._wrapLogFn(defaults)
      this[type].raw = this._wrapLogFn(defaults, true)
    }

    // Use _mockFn if is set
    if (this._mockFn) {
      this.mockTypes()
    }

    // Keep serialized version of last log
    this._lastLogSerialized = undefined
    this._lastLog = undefined
    this._lastLogTime = undefined
    this._lastLogCount = 0
    this._throttleTimeout = undefined
  }

  get stdout () {
    return this._stdout || console._stdout // eslint-disable-line no-console
  }

  get stderr () {
    return this._stderr || console._stderr // eslint-disable-line no-console
  }

  create (options) {
    return new Consola(Object.assign({
      reporters: this._reporters,
      level: this.level,
      types: this._types,
      defaults: this._defaults,
      stdout: this._stdout,
      stderr: this._stderr,
      mockFn: this._mockFn
    }, options))
  }

  withDefaults (defaults) {
    return this.create({
      defaults: Object.assign({}, this._defaults, defaults)
    })
  }

  withTag (tag) {
    return this.withDefaults({
      tag: this._defaults.tag ? (this._defaults.tag + ':' + tag) : tag
    })
  }

  addReporter (reporter) {
    this._reporters.push(reporter)
    return this
  }

  removeReporter (reporter) {
    if (reporter) {
      const i = this._reporters.indexOf(reporter)
      if (i >= 0) {
        return this._reporters.splice(i, 1)
      }
    } else {
      this._reporters.splice(0)
    }
    return this
  }

  setReporters (reporters) {
    this._reporters = Array.isArray(reporters)
      ? reporters
      : [reporters]
    return this
  }

  wrapAll () {
    this.wrapConsole()
    this.wrapStd()
  }

  restoreAll () {
    this.restoreConsole()
    this.restoreStd()
  }

  wrapConsole () {
    for (const type in this._types) {
      // Backup original value
      if (!console['__' + type]) { // eslint-disable-line no-console
        console['__' + type] = console[type] // eslint-disable-line no-console
      }
      // Override
      console[type] = this[type].raw // eslint-disable-line no-console
    }
  }

  restoreConsole () {
    for (const type in this._types) {
      // Restore if backup is available
      if (console['__' + type]) { // eslint-disable-line no-console
        console[type] = console['__' + type] // eslint-disable-line no-console
        delete console['__' + type] // eslint-disable-line no-console
      }
    }
  }

  wrapStd () {
    this._wrapStream(this.stdout, 'log')
    this._wrapStream(this.stderr, 'log')
  }

  _wrapStream (stream, type) {
    if (!stream) {
      return
    }

    // Backup original value
    if (!stream.__write) {
      stream.__write = stream.write
    }

    // Override
    stream.write = (data) => {
      this[type].raw(String(data).trim())
    }
  }

  restoreStd () {
    this._restoreStream(this.stdout)
    this._restoreStream(this.stderr)
  }

  _restoreStream (stream) {
    if (!stream) {
      return
    }

    if (stream.__write) {
      stream.write = stream.__write
      delete stream.__write
    }
  }

  pauseLogs () {
    paused = true
  }

  resumeLogs () {
    paused = false

    // Process queue
    const _queue = queue.splice(0)
    for (const item of _queue) {
      item[0]._logFn(item[1], item[2])
    }
  }

  mockTypes (mockFn) {
    this._mockFn = mockFn || this._mockFn

    if (typeof this._mockFn !== 'function') {
      return
    }

    for (const type in this._types) {
      this[type] = this._mockFn(type, this._types[type]) || this[type]
      this[type].raw = this[type]
    }
  }

  _wrapLogFn (defaults, isRaw) {
    return (...args) => {
      if (paused) {
        queue.push([this, defaults, args, isRaw])
        return
      }
      return this._logFn(defaults, args, isRaw)
    }
  }

  _logFn (defaults, args, isRaw) {
    if (defaults.level > this.level) {
      return this._async ? Promise.resolve(false) : false
    }

    // Construct a new log object
    const logObj = Object.assign({
      date: new Date(),
      args: []
    }, defaults)

    // Consume arguments
    if (!isRaw && args.length === 1 && isLogObj(args[0])) {
      Object.assign(logObj, args[0])
    } else {
      logObj.args = Array.from(args)
    }

    // Aliases
    if (logObj.message) {
      logObj.args.unshift(logObj.message)
      delete logObj.message
    }
    if (logObj.additional) {
      if (!Array.isArray(logObj.additional)) {
        logObj.additional = logObj.additional.split('\n')
      }
      logObj.args.push('\n' + logObj.additional.join('\n'))
      delete logObj.additional
    }

    // Normalize type and tag to lowercase
    logObj.type = typeof logObj.type === 'string' ? logObj.type.toLowerCase() : ''
    logObj.tag = typeof logObj.tag === 'string' ? logObj.tag.toLowerCase() : ''

    // Resolve log
    /**
     * @param newLog false if the throttle expired and
     *  we don't want to log a duplicate
     */
    const resolveLog = (newLog = false) => {
      const repeated = this._lastLogCount - this._throttleMin
      if (this._lastLog && repeated > 0) {
        const args = [...this._lastLog.args]
        if (repeated > 1) {
          args.push(`(repeated ${repeated} times)`)
        }
        this._log({ ...this._lastLog, args })
        this._lastLogCount = 1
      }

      // Log
      if (newLog) {
        this._lastLog = logObj
        if (this._async) {
          return this._logAsync(logObj)
        } else {
          this._log(logObj)
        }
      }
    }

    // Throttle
    clearTimeout(this._throttleTimeout)
    const diffTime = this._lastLogTime ? logObj.date - this._lastLogTime : 0
    this._lastLogTime = logObj.date
    if (diffTime < this._throttle) {
      try {
        const serializedLog = JSON.stringify([logObj.type, logObj.tag, logObj.args])
        const isSameLog = this._lastLogSerialized === serializedLog
        this._lastLogSerialized = serializedLog
        if (isSameLog) {
          this._lastLogCount++
          if (this._lastLogCount > this._throttleMin) {
          // Auto-resolve when throttle is timed out
            this._throttleTimeout = setTimeout(resolveLog, this._throttle)
            return // SPAM!
          }
        }
      } catch (_) {
        // Circular References
      }
    }

    resolveLog(true)
  }

  _log (logObj) {
    for (const reporter of this._reporters) {
      reporter.log(logObj, {
        async: false,
        stdout: this.stdout,
        stderr: this.stderr
      })
    }
  }

  _logAsync (logObj) {
    return Promise.all(
      this._reporters.map(reporter => reporter.log(logObj, {
        async: true,
        stdout: this.stdout,
        stderr: this.stderr
      }))
    )
  }
}

// Legacy support
Consola.prototype.add = Consola.prototype.addReporter

Consola.prototype.remove = Consola.prototype.removeReporter
Consola.prototype.clear = Consola.prototype.removeReporter

Consola.prototype.withScope = Consola.prototype.withTag

Consola.prototype.mock = Consola.prototype.mockTypes

Consola.prototype.pause = Consola.prototype.pauseLogs
Consola.prototype.resume = Consola.prototype.resumeLogs

// Export class
export default Consola
