import { vsprintf } from 'printj'

const FORMAT_ARGS = [
  ['additional', 5],
  ['message', 4],
  ['type', 2],
  ['date', 1],
  ['tag', 3]
] // .sort((a, b) => b[0].length - a[0].length)

const _compileCache = {}
// process.on('beforeExit', () => { console.log(_compileCache) })

export function compileFormat (format) {
  if (_compileCache[format]) {
    return _compileCache[format]
  }

  let _format = format
  for (const arg of FORMAT_ARGS) {
    _format = _format.replace(new RegExp('([%-])' + arg[0], 'g'), '$1' + arg[1])
  }

  _compileCache[format] = _format
  return _format
}

export function formatString (format, argv) {
  return vsprintf(compileFormat(format), argv)
}
