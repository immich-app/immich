interface RecursiveObject {
  [key: string]: RecursiveObject | {};
}

export function buildFolderTree(paths: string[]) {
  const root: RecursiveObject = {};
  paths.forEach((path) => {
    const parts = path.split('/');
    let current = root;
    parts.forEach((part) => {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    });
  });
  return root;
}
