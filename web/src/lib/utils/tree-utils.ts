export class TreeNode extends Map<string, TreeNode> {
  value: string;
  path: string;
  parent: TreeNode | null;
  hasLeaf: boolean;
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
          const child = new TreeNode(part, joinPaths(current.path, part), current);
          current.set(part, child);
        }
        current = current.get(part)!;
      }
      current.hasLeaf = true;
    }
    return root;
  }

  collapseTree() {
    if (this.size === 1 && !this.hasLeaf) {
      const child = this.values().next().value!;
      child.value = joinPaths(this.value, child.value);
      child.parent = this.parent;
      if (this.parent !== null) {
        this.parent.delete(this.value);
        this.parent.set(child.value, child);
      }
    }

    for (const child of this.values()) {
      child.collapseTree();
    }
  }

  closestRelativeNode(path: string) {
    const parts = getPathParts(path);
    let current: TreeNode = this;
    let curPart = null;
    for (const part of parts) {
      curPart = curPart === null ? part : joinPaths(curPart, part);
      const next = current.get(curPart);
      if (next) {
        current = next;
        curPart = null;
      }
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

export function joinPaths(path1: string, path2: string) {
  if (!path1) {
    return path2;
  }

  if (!path2) {
    return path1;
  }

  if (path1[path1.length - 1] === '/') {
    return path1 + path2;
  }

  return path1 + '/' + path2;
}

export function getParentPath(path: string) {
  const normalized = normalizeTreePath(path);
  const last = normalized.lastIndexOf('/');
  if (last > 0) {
    return normalized.slice(0, last);
  }
  return last === 0 ? '/' : normalized;
}
