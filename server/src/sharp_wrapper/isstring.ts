export function is_string(x: any): boolean {
  return Object.prototype.toString.call(x) === '[object String]';
}
