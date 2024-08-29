export interface RecursiveObject {
  [key: string]: RecursiveObject;
}

export const normalizeTreePath = (path: string) => path.replace(/^\//, '').replace(/\/$/, '');

export function buildTree(paths: string[]) {
  const root: RecursiveObject = {};

  paths.sort();

  for (const path of paths) {
    const parts = path.split('/');
    let current = root;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }
  return root;
}
