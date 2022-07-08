export function isPlainObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

// TODO: remove for consola@3
export function isLogObj (arg) {
  // Should be plain object
  if (!isPlainObject(arg)) {
    return false
  }

  // Should contains either 'message' or 'args' field
  if (!arg.message && !arg.args) {
    return false
  }

  // Handle non-standard error objects
  if (arg.stack) {
    return false
  }

  return true
}
