import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service.js';
import { DeviceResolverService } from 'src/services/device-resolver/device-resolver.service.js';
import { DeviceIdentity } from 'src/services/device-resolver/device-resolver.types.js';

export type ReconcileReason = 'not-tracked' | 'still-at-known-path' | 'relinked' | 'no-match-found';

export interface ReconcileResult {
  reason: ReconcileReason;
  relinked: boolean;
  oldPath?: string;
  newPath?: string;
}

/**
 * Phase 1, work item 4 of the PhotoManager plan: when a removable drive backing a library reconnects under a
 * different OS-assigned mount path or drive letter, this is what keeps the library pointed at it without
 * losing track of already-indexed assets.
 *
 * Immich's own external-library scan identifies assets by exact `originalPath` equality (see
 * `LibraryService.processEntity` and `AssetRepository.filterNewExternalAssetPaths`/`detectOfflineExternalAssets`)
 * - its per-asset "checksum" for external assets is a hash of the path string, not file content
 * (`ChecksumAlgorithm.sha1Path`), so it can't be reused to recognize a file that moved to a new path. If a
 * reconnect changes the mount path, every asset's recorded path goes stale: the scan marks them offline, then
 * rediscovers the same files as brand-new assets at the new path - which is what forces a full
 * thumbnail/ML/metadata reprocessing (immich-app/immich#17290).
 *
 * The fix here is cheaper than re-hashing every file: recognize the reconnect via DeviceResolverService, then
 * rewrite the library's import path and every existing asset's `originalPath` prefix to the new location
 * *before* the next scan runs, so `stat(asset.originalPath)` succeeds again at the same logical file and no
 * asset ever goes offline or gets rediscovered.
 *
 * NOT YET WIRED to run automatically: this service doesn't call into LibraryService's scan cron, since services
 * in this codebase don't inject one another - communication between them happens through jobs/events - so the
 * right trigger (a new job this fires on a device-mount event, before the library-scan cron?) needs its own
 * decision instead of folding in ad hoc. `candidateRoots` is likewise left as an explicit parameter rather than
 * having this enumerate the OS's current mounts itself, since that enumeration doesn't exist yet on
 * VolumeInfoRepository.
 */
@Injectable()
export class DeviceMountService extends BaseService {
  async reconcilePath(libraryId: string, candidateRoots: string[]): Promise<ReconcileResult> {
    const mount = await this.deviceMountRepository.getByLibraryId(libraryId);
    if (!mount) {
      return { reason: 'not-tracked', relinked: false };
    }

    if (await this.pathExists(mount.lastKnownPath)) {
      return { reason: 'still-at-known-path', relinked: false };
    }

    const resolver = new DeviceResolverService(this.volumeInfoRepository);

    for (const root of candidateRoots) {
      const identity = await resolver.resolve(root);
      if (identity && identity.id === mount.volumeId) {
        await this.relink(libraryId, mount.lastKnownPath, root, identity);
        return { reason: 'relinked', relinked: true, oldPath: mount.lastKnownPath, newPath: root };
      }
    }

    return { reason: 'no-match-found', relinked: false };
  }

  private async relink(libraryId: string, oldPath: string, newPath: string, identity: DeviceIdentity): Promise<void> {
    const library = await this.libraryRepository.get(libraryId);
    if (library) {
      await this.libraryRepository.update(libraryId, {
        importPaths: library.importPaths.map((importPath) => rewritePrefix(importPath, oldPath, newPath)),
      });
    }

    await this.assetRepository.rewriteOriginalPathPrefix(libraryId, oldPath, newPath);

    await this.deviceMountRepository.upsert({
      libraryId,
      volumeId: identity.id,
      identityMethod: identity.method,
      identityConfidence: identity.confidence,
      lastKnownPath: newPath,
    });
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await this.storageRepository.stat(path);
      return true;
    } catch {
      return false;
    }
  }
}

/** Replaces `oldPrefix` with `newPrefix` at the start of `value`, leaving it untouched if the prefix doesn't match. */
function rewritePrefix(value: string, oldPrefix: string, newPrefix: string): string {
  return value.startsWith(oldPrefix) ? newPrefix + value.slice(oldPrefix.length) : value;
}
