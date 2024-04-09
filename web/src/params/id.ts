export function match(param) {
  return /^[\dA-Fa-f]{8}(?:\b-[\dA-Fa-f]{4}){3}\b-[\dA-Fa-f]{12}$/.test(param);
}
