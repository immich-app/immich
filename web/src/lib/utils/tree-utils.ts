export class TreeNode extends Map<string, TreeNode> {
  readonly value: string;
  readonly path: string;
  readonly parent: TreeNode | null;
  readonly hasLeaf: boolean;
  #parents: TreeNode[] | null;
  #children: TreeNode[] | null;

  private constructor(value: string, path: string, parent: TreeNode | null) {
    super();
    this.value = value;
    this.parent = parent;
    this.path = path;
    this.hasLeaf = false;
    this.#parents = null;
    this.#children = null;
  }

  static fromPaths(paths: string[]) {
    const root = new TreeNode('', '', null);
    for (const path of paths) {
      let current = root;
      for (const part of getPathParts(path)) {
        if (!current.has(part)) {
          const child = new TreeNode(part, joinPaths([current.path, part]), current);
          current.set(part, child);
        }
        current = current.get(part)!;
      }
      (current.hasLeaf as boolean) = true; // allow reading but not modifying properties externally
    }
    return root;
  }

  lowestCommonNode() {
    let curNode: TreeNode = this;
    while (curNode.size === 1) {
      const nextNode = curNode.values().next().value!;
      curNode = nextNode;
    }
    return curNode;
  }

  closestRelativeNode(path: string): TreeNode {
    const parts = getPathParts(normalizeTreePath(path));
    let current: TreeNode = this;
    for (const part of parts) {
      if (!current || !current.has(part)) {
        break;
      }
      current = current.get(part)!;
    }
    return current;
  }

  get parents(): TreeNode[] {
    if (this.#parents) {
      return this.#parents;
    }
    const parents: TreeNode[] = [];
    let current: TreeNode | null = this.parent;
    while (current !== null && current.parent !== null) {
      parents.push(current);
      current = current.parent;
    }
    return (this.#parents = parents.reverse());
  }

  get children(): TreeNode[] {
    return (this.#children ??= this.values().toArray());
  }
}

export const normalizeTreePath = (path: string) =>
  path.length > 1 && path[path.length - 1] === '/' ? path.slice(0, -1) : path;

export function getPathParts(path: string) {
  const parts = path.split('/');
  if (path[0] === '/') {
    parts[0] = '/';
  }

  if (path[path.length - 1] === '/') {
    parts.pop();
  }

  return parts;
}

export function joinPaths(inputPaths: string[]) {
  const paths = new Array(inputPaths.length);
  for (let i = 0; i < inputPaths.length; i++) {
    const path = inputPaths[i];
    if (path === '/') {
      paths[i] = '';
    } else if (path.length > 0) {
      paths[i] = path;
    }
  }
  return paths.join('/');
}

export function getParentPath(path: string) {
  const normalized = normalizeTreePath(path);
  const last = normalized.lastIndexOf('/');
  if (last > 0) {
    return normalized.slice(0, last);
  }
  return last === 0 ? '/' : normalized;
}
