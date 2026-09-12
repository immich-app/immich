import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators.js';
import { JobName, JobStatus, QueueName } from 'src/enum.js';
import { BaseService } from 'src/services/base.service.js';
import { DeviceResolverService } from 'src/services/device-resolver/device-resolver.service.js';
import { DeviceIdentity } from 'src/services/device-resolver/device-resolver.types.js';
import type { JobOf } from 'src/types.js';

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
 * The fix here is a hybrid, applied *before* the next scan runs so no asset ever goes offline or gets
 * rediscovered: recognize the reconnect via DeviceResolverService (unchanged - still the cheap, content-free way
 * to answer "which library does this newly-mounted drive belong to"), then relink in two passes. First, a bulk
 * path-prefix rewrite across the library's import paths and every asset's `originalPath` - free of file reads,
 * and sufficient whenever the drive's internal folder structure didn't change. Second, a content-checksum
 * fallback (relinkByContent) for anything the prefix rewrite couldn't follow, i.e. a file also renamed or moved
 * within the drive - this is why external assets are now checksummed from file content rather than path (see
 * LibraryService.processEntity).
 *
 * Wired to run automatically via the job queue (this codebase's only cross-service coordination mechanism, since
 * services don't inject one another): LibraryService queues JobName.DeviceMountReconcile for every library right
 * before it queues the files-sync job, both from its periodic scan-all cron (handleQueueScanAll) and from the
 * existing manual "scan this library now" trigger (queueScan / POST /libraries/:id/scan) - so that same endpoint
 * doubles as a manual "rescan my drive now" button, with no new endpoint needed. `handleReconcile` below is what
 * that job calls into; it discovers candidate mount roots itself via VolumeInfoRepository.listMountedVolumes()
 * rather than requiring a caller to enumerate them.
 */
@Injectable()
export class DeviceMountService extends BaseService {
  @OnJob({ name: JobName.DeviceMountReconcile, queue: QueueName.Library })
  async handleReconcile(job: JobOf<JobName.DeviceMountReconcile>): Promise<JobStatus> {
    const candidateRoots = await this.volumeInfoRepository.listMountedVolumes();
    const result = await this.reconcilePath(job.id, candidateRoots);

    if (result.relinked) {
      this.logger.log(`Relinked library ${job.id} from ${result.oldPath} to ${result.newPath}`);
    }

    return JobStatus.Success;
  }

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

    // Fast path: handles the common case of a whole-drive remount where every file's relative path is unchanged -
    // one bulk UPDATE, no file reads.
    await this.assetRepository.rewriteOriginalPathPrefix(libraryId, oldPath, newPath);

    // Fallback: catches files that were also renamed/moved within the drive, which the prefix rewrite above can't
    // follow since it only knows the old and new *mount point*, not the old and new path of any individual file.
    if (library) {
      await this.relinkByContent(library, newPath);
    }

    await this.deviceMountRepository.upsert({
      libraryId,
      volumeId: identity.id,
      identityMethod: identity.method,
      identityConfidence: identity.confidence,
      lastKnownPath: newPath,
    });
  }

  /**
   * Re-identifies files by content checksum rather than path, so a file renamed or moved to a different folder
   * within the same drive still gets recognized as the asset it already is instead of offlined-then-rediscovered.
   * Relies on external assets being checksummed from file content (see LibraryService.processEntity) - a checksum
   * match against an existing asset in this library means "this is that asset, just not at its recorded path
   * anymore", so its `originalPath` gets corrected in place.
   *
   * Walks every file under `newRoot` (library.exclusionPatterns applied, same as a normal scan), skipping any file
   * that already has an asset row at its exact current path - only files that are NOT already correctly linked pay
   * the cost of a content hash.
   */
  private async relinkByContent(
    library: { id: string; ownerId: string; exclusionPatterns: string[] },
    newRoot: string,
  ): Promise<void> {
    const filePaths = await this.storageRepository.crawl({
      pathsToCrawl: [newRoot],
      exclusionPatterns: library.exclusionPatterns,
      includeHidden: false,
    });

    for (const filePath of filePaths) {
      const alreadyLinked = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, filePath);
      if (alreadyLinked) {
        continue;
      }

      const checksum = await this.cryptoRepository.hashFile(filePath);
      const match = await this.assetRepository.getByChecksum({
        ownerId: library.ownerId,
        libraryId: library.id,
        checksum,
      });
      if (match && match.originalPath !== filePath) {
        await this.assetRepository.update({ id: match.id, originalPath: filePath });
      }
    }
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
