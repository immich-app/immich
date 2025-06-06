/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable unicorn/no-this-assignment */
/* eslint-disable unicorn/prefer-at */
import type { TagResponseDto } from '@immich/sdk';

export class TreeNode extends Map<string, TreeNode> {
  value: string;
  path: string;
  parent: TreeNode | null;
  hasAssets: boolean;
  id: string | undefined;
  color: string | undefined;
  private _parents: TreeNode[] | undefined;
  private _children: TreeNode[] | undefined;

  private constructor(value: string, path: string, parent: TreeNode | null) {
    super();
    this.value = value;
    this.parent = parent;
    this.path = path;
    this.hasAssets = false;
  }

  static fromPaths(paths: string[]) {
    const root = new TreeNode('', '', null);
    for (const path of paths) {
      const current = root.add(path);
      current.hasAssets = true;
    }
    return root;
  }

  static fromTags(tags: TagResponseDto[]) {
    const root = new TreeNode('', '', null);
    for (const tag of tags) {
      const current = root.add(tag.value);
      current.hasAssets = true;
      current.id = tag.id;
      current.color = tag.color;
    }
    return root;
  }

  traverse(path: string) {
    const parts = getPathParts(path);
    let current: TreeNode = this;
    let curPart = null;
    for (const part of parts) {
      // segments common to all subtrees can be collapsed together
      curPart = curPart === null ? part : joinPaths(curPart, part);
      const next = current.get(curPart);
      if (next) {
        current = next;
        curPart = null;
      }
    }
    return current;
  }

  collapse() {
    if (this.size === 1 && !this.hasAssets) {
      const child = this.values().next().value!;
      child.value = joinPaths(this.value, child.value);
      child.parent = this.parent;
      if (this.parent !== null) {
        this.parent.delete(this.value);
        this.parent.set(child.value, child);
      }
    }

    for (const child of this.values()) {
      child.collapse();
    }
  }

  private add(path: string) {
    let current: TreeNode = this;
    for (const part of getPathParts(path)) {
      let next = current.get(part);
      if (next === undefined) {
        next = new TreeNode(part, joinPaths(current.path, part), current);
        current.set(part, next);
      }
      current = next;
    }
    return current;
  }

  get parents(): TreeNode[] {
    if (this._parents) {
      return this._parents;
    }
    const parents: TreeNode[] = [];
    let current: TreeNode | null = this.parent;
    while (current !== null && current.parent !== null) {
      parents.push(current);
      current = current.parent;
    }
    return (this._parents = parents.reverse());
  }

  get children(): TreeNode[] {
    return (this._children ??= this.values().toArray());
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
