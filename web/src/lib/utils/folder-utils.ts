export interface RecursiveObject {
  [key: string]: RecursiveObject;
}

export function buildFolderTree(paths: string[]) {
  const root: RecursiveObject = {};
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
