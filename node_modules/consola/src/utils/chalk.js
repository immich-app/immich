import chalk from 'chalk'

const _colorCache = {}

export function chalkColor (name) {
  let color = _colorCache[name]
  if (color) {
    return color
  }

  if (name[0] === '#') {
    color = chalk.hex(name)
  } else {
    color = chalk[name] || chalk.keyword(name)
  }

  _colorCache[name] = color
  return color
}

const _bgColorCache = {}

export function chalkBgColor (name) {
  let color = _bgColorCache[name]
  if (color) {
    return color
  }

  if (name[0] === '#') {
    color = chalk.bgHex(name)
  } else {
    color = chalk['bg' + name[0].toUpperCase() + name.slice(1)] || chalk.bgKeyword(name)
  }

  _bgColorCache[name] = color
  return color
}
