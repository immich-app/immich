import { sep } from 'path'

export function parseStack (stack) {
  const cwd = process.cwd() + sep

  const lines = stack
    .split('\n')
    .splice(1)
    .map(l => l
      .trim()
      .replace('file://', '')
      .replace(cwd, '')
    )

  return lines
}
