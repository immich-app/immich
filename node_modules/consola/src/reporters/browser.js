export default class BrowserReporter {
  constructor (options) {
    this.options = Object.assign({}, options)

    this.defaultColor = '#7f8c8d' // Gray
    this.levelColorMap = {
      0: '#c0392b', // Red
      1: '#f39c12', // Yellow
      3: '#00BCD4' // Cyan
    }
    this.typeColorMap = {
      success: '#2ecc71' // Green
    }
  }

  log (logObj) {
    const consoleLogFn = logObj.level < 1
      // eslint-disable-next-line no-console
      ? (console.__error || console.error)
      // eslint-disable-next-line no-console
      : logObj.level === 1 && console.warn ? (console.__warn || console.warn) : (console.__log || console.log)

    // Type
    const type = logObj.type !== 'log' ? logObj.type : ''

    // Tag
    const tag = logObj.tag ? logObj.tag : ''

    // Styles
    const color = this.typeColorMap[logObj.type] || this.levelColorMap[logObj.level] || this.defaultColor
    const style = `
      background: ${color};
      border-radius: 0.5em;
      color: white;
      font-weight: bold;
      padding: 2px 0.5em;
    `

    const badge = `%c${[tag, type].filter(Boolean).join(':')}`

    // Log to the console
    if (typeof logObj.args[0] === 'string') {
      consoleLogFn(
        `${badge}%c ${logObj.args[0]}`,
        style,
        // Empty string as style resets to default console style
        '',
        ...logObj.args.slice(1)
      )
    } else {
      consoleLogFn(badge, style, ...logObj.args)
    }
  }
}
