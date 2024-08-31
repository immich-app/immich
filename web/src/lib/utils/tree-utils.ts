export type RecursiveObject = {
  [key: string]: RecursiveObject;
};

export const normalizeTreePath = (path: string) => (path.at(-1) === '/' && path.length > 1 ? path.slice(0, -1) : path);

export const getPathParts = (path: string) => {
  const parts = path.split('/');
  if (path[0] === '/') {
    parts[0] = '/';
  }

  if (path.at(-1) === '/') {
    parts.pop();
  }

  return parts;
};

export const joinPaths = (...paths: string[]) => {
  const filtered = paths.filter((path) => path.length > 0);
  if (filtered.length < 2) {
    return filtered[0] || '';
  }
  return filtered.map((path) => (path === '/' ? '' : path)).join('/');
};

export const getParentPath = (path: string) => {
  const normalized = normalizeTreePath(path);
  const last = normalized.lastIndexOf('/');
  return last === -1 ? '' : normalized.slice(0, last);
};

export const isLeaf = (tree: RecursiveObject) => {
  for (const entry in tree) {
    if (entry !== '\0') {
      return false;
    }
  }
  return true;
};

export function buildTree(paths: string[]): RecursiveObject {
  const root: RecursiveObject = {};

  for (const path of paths) {
    const parts = getPathParts(path);
    let current = root;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    current['\0'] = {}; // mark as leaf
  }
  return root;
}
