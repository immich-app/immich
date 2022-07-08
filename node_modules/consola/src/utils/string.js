export function centerAlign (str, len, space = ' ') {
  const free = len - str.length
  if (free <= 0) {
    return str
  }
  const freeLeft = Math.floor(free / 2)
  let _str = ''
  for (let i = 0; i < len; i++) {
    _str += (i < freeLeft || i >= freeLeft + str.length) ? space : str[i - freeLeft]
  }
  return _str
}

export function rightAlign (str, len, space = ' ') {
  const free = len - str.length
  if (free <= 0) {
    return str
  }
  let _str = ''
  for (let i = 0; i < len; i++) {
    _str += i < free ? space : str[i - free]
  }
  return _str
}

export function leftAlign (str, len, space = ' ') {
  let _str = ''
  for (let i = 0; i < len; i++) {
    _str += i < str.length ? str[i] : space
  }
  return _str
}

export function align (alignment, str, len, space = ' ') {
  switch (alignment) {
    case 'left': return leftAlign(str, len, space)
    case 'right': return rightAlign(str, len, space)
    case 'center': return centerAlign(str, len, space)
    default: return str
  }
}
