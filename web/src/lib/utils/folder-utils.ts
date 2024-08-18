export function buildFolderTree(paths: string[]): any {
  const root: { [key: string]: any } = {};
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
