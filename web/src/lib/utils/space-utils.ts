import type { SharedSpaceResponseDto } from '@immich/sdk';

export interface SplitResult {
  pinned: SharedSpaceResponseDto[];
  unpinned: SharedSpaceResponseDto[];
  showSection: boolean;
}

export function splitPinnedSpaces(spaces: SharedSpaceResponseDto[], pinnedIds: string[]): SplitResult {
  const pinnedSet = new Set(pinnedIds);
  const pinned = spaces.filter((s) => pinnedSet.has(s.id));
  const unpinned = spaces.filter((s) => !pinnedSet.has(s.id));
  const showSection = pinned.length > 0 && unpinned.length > 0;
  return { pinned, unpinned, showSection };
}
