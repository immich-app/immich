import { page } from '$app/state';
import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { OnArchive, OnDelete, OnFavorite, OnUndoDelete } from '$lib/utils/actions';
import { isAlbumsRoute, isSpacesRoute } from '$lib/utils/navigation';
import {
  AssetVisibility,
  SharedSpaceRole,
  type AlbumResponseDto,
  type SharedSpaceMemberResponseDto,
  type SharedSpaceResponseDto,
} from '@immich/sdk';

export interface AlbumContext {
  id: string;
  albumName: string;
  ownerId: string;
  isOwner: boolean;
  isMember: boolean;
  /** Original DTO — passed through for handlers that open modals or call SDKs needing the full object. */
  raw: AlbumResponseDto;
}

export interface SpaceContext {
  id: string;
  name: string;
  createdById: string;
  isOwner: boolean;
  isMember: boolean;
  canWrite: boolean;
  addPhotosToCurrentSpace?: () => void;
  /** Original DTO. */
  raw: SharedSpaceResponseDto;
  /** Separately-fetched members list (space page loader returns this as `data.members`). */
  members: SharedSpaceMemberResponseDto[];
}

export type RegisterSpaceContextOptions = {
  getAddPhotosToCurrentSpace?: () => (() => void) | undefined;
};

export interface SelectionCommandContext {
  assets: TimelineAsset[];
  selectedAssetIds: string[];
  ownedAssets: TimelineAsset[];
  ownedSelectedAssetIds: string[];
  canAddToAlbum: boolean;
  canAddToSpace: boolean;
  isAllUserOwned: boolean;
  isAllFavorite: boolean;
  isAllArchived: boolean;
  isAllTrashed: boolean;
  clearSelection: () => void;
  onFavorite?: OnFavorite;
  onArchive?: OnArchive;
  onDelete?: OnDelete;
  onUndoDelete?: OnUndoDelete;
  addSelectedToCurrentSpace?: () => Promise<boolean>;
}

export type RegisterSelectionContextOptions = {
  getAssets: () => TimelineAsset[];
  clearSelection: () => void;
  canAddToAlbum?: () => boolean;
  canAddToSpace?: () => boolean;
  getOnFavorite?: () => OnFavorite | undefined;
  getOnArchive?: () => OnArchive | undefined;
  getOnDelete?: () => OnDelete | undefined;
  getOnUndoDelete?: () => OnUndoDelete | undefined;
  getAddSelectedToCurrentSpace?: () => (() => Promise<boolean>) | undefined;
};

type RegisteredSelectionContext = {
  routeId: string | null;
  options: RegisterSelectionContextOptions;
  token: symbol;
};

export interface CommandContext {
  routeId: string | null;
  params: Record<string, string>;
  album: AlbumContext | null;
  space: SpaceContext | null;
  selection: SelectionCommandContext | null;
  userId: string | null;
  isAdmin: boolean;
}

class CommandContextManager {
  private _album: AlbumContext | null = $state(null);
  private _space: SpaceContext | null = $state(null);
  private _selection: RegisteredSelectionContext | null = $state(null);

  setAlbum(album: AlbumContext | null) {
    this._album = album;
  }

  setSpace(space: SpaceContext | null) {
    this._space = space;
  }

  setSelection(selection: RegisteredSelectionContext | null) {
    this._selection = selection;
  }

  clearSelection(token: symbol) {
    if (this._selection?.token === token) {
      this._selection = null;
    }
  }

  /**
   * Snapshot read at provider-run time. Pure; no side effects.
   *
   * Album/space are gated by the current route id so a stale context left
   * behind by a page unmount race can't leak verbs onto an unrelated page
   * (e.g. album commands appearing while on a space).
   */
  getContext(): CommandContext {
    const u = authManager.authenticated ? authManager.user : null;
    const routeId = page.route.id;
    const userId = u?.id ?? null;
    return {
      routeId,
      params: { ...page.params },
      album: isAlbumsRoute(routeId) ? this._album : null,
      space: isSpacesRoute(routeId) ? this._space : null,
      selection: this.getSelection(routeId, userId),
      userId,
      isAdmin: u?.isAdmin ?? false,
    };
  }

  private getSelection(routeId: string | null, currentUserId: string | null): SelectionCommandContext | null {
    const registered = this._selection;
    if (!registered || registered.routeId !== routeId) {
      return null;
    }

    const assets = this.uniqueAssets(registered.options.getAssets());
    if (assets.length === 0) {
      return null;
    }

    const ownedAssets = currentUserId === null ? [] : assets.filter((asset) => asset.ownerId === currentUserId);
    const selectedAssetIds = assets.map((asset) => asset.id);
    const ownedSelectedAssetIds = ownedAssets.map((asset) => asset.id);

    return {
      assets,
      selectedAssetIds,
      ownedAssets,
      ownedSelectedAssetIds,
      canAddToAlbum: registered.options.canAddToAlbum?.() ?? false,
      canAddToSpace: registered.options.canAddToSpace?.() ?? false,
      isAllUserOwned: currentUserId !== null && ownedAssets.length === assets.length,
      isAllFavorite: assets.every((asset) => asset.isFavorite),
      isAllArchived: assets.every((asset) => asset.visibility === AssetVisibility.Archive),
      isAllTrashed: assets.every((asset) => asset.isTrashed),
      clearSelection: registered.options.clearSelection,
      onFavorite: registered.options.getOnFavorite?.(),
      onArchive: registered.options.getOnArchive?.(),
      onDelete: registered.options.getOnDelete?.(),
      onUndoDelete: registered.options.getOnUndoDelete?.(),
      addSelectedToCurrentSpace: registered.options.getAddSelectedToCurrentSpace?.(),
    };
  }

  private uniqueAssets(assets: TimelineAsset[]) {
    // Local dedupe only; no Svelte subscription reads this Set.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const seen = new Set<string>();
    const unique: TimelineAsset[] = [];
    for (const asset of assets) {
      if (seen.has(asset.id)) {
        continue;
      }
      seen.add(asset.id);
      unique.push(asset);
    }
    return unique;
  }
}

export const commandContextManager = new CommandContextManager();

/**
 * Call inside a page component's script block. Registers a reactive album
 * context derived from the page's DTO thunk, computes `isOwner` / `isMember`,
 * and clears on unmount.
 */
export function registerAlbumContext(albumDto: () => AlbumResponseDto) {
  $effect(() => {
    const currentUserId = authManager.authenticated ? (authManager.user?.id ?? null) : null;
    const album = albumDto();
    const isMember = album.albumUsers?.some((u) => u.user.id === currentUserId) ?? false;
    commandContextManager.setAlbum({
      id: album.id,
      albumName: album.albumName,
      ownerId: album.ownerId,
      isOwner: currentUserId !== null && currentUserId === album.ownerId,
      isMember,
      raw: album,
    });
    return () => commandContextManager.setAlbum(null);
  });
}

/**
 * Call inside a space page component's script block. Takes two thunks because
 * the space detail loader fetches space and members separately; `space.members`
 * on the DTO is NOT reliably populated.
 */
export function registerSpaceContext(
  getSpace: () => SharedSpaceResponseDto | undefined,
  getMembers: () => SharedSpaceMemberResponseDto[] | undefined,
  options: RegisterSpaceContextOptions = {},
) {
  $effect(() => {
    const currentUserId = authManager.authenticated ? (authManager.user?.id ?? null) : null;
    const space = getSpace();
    if (!space) {
      commandContextManager.setSpace(null);
      return;
    }
    const members = getMembers() ?? [];
    const self = members.find((m) => m.userId === currentUserId);
    const role = self?.role as unknown as SharedSpaceRole | undefined;
    const isOwner = currentUserId !== null && currentUserId === space.createdById;
    const canWrite = role === SharedSpaceRole.Owner || role === SharedSpaceRole.Editor;
    commandContextManager.setSpace({
      id: space.id,
      name: space.name,
      createdById: space.createdById,
      isOwner,
      isMember: self !== undefined,
      canWrite,
      addPhotosToCurrentSpace: options.getAddPhotosToCurrentSpace?.(),
      raw: space,
      members,
    });
    return () => commandContextManager.setSpace(null);
  });
}

export function registerSelectionContext(options: RegisterSelectionContextOptions) {
  const routeId = page.route.id;
  const token = Symbol('cmdk-selection-context');

  $effect(() => {
    commandContextManager.setSelection({ routeId, options, token });
    return () => commandContextManager.clearSelection(token);
  });
}
