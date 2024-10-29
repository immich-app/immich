import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { resolve } from 'node:path';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import {
  AuditDeletesDto,
  AuditDeletesResponseDto,
  FileChecksumDto,
  FileChecksumResponseDto,
  FileReportItemDto,
  PathEntityType,
} from 'src/dtos/audit.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AssetFileType,
  AssetPathType,
  DatabaseAction,
  Permission,
  PersonPathType,
  StorageFolder,
  UserPathType,
} from 'src/enum';
import { JOBS_ASSET_PAGINATION_SIZE, JobStatus } from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { getAssetFiles } from 'src/utils/asset.util';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class AuditService extends BaseService {
  async handleCleanup(): Promise<JobStatus> {
    await this.auditRepository.removeBefore(DateTime.now().minus(AUDIT_LOG_MAX_DURATION).toJSDate());
    return JobStatus.SUCCESS;
  }

  async getDeletes(auth: AuthDto, dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    const userId = dto.userId || auth.user.id;
    await this.requireAccess({ auth, permission: Permission.TIMELINE_READ, ids: [userId] });

    const audits = await this.auditRepository.getAfter(dto.after, {
      userIds: [userId],
      entityType: dto.entityType,
      action: DatabaseAction.DELETE,
    });

    const duration = DateTime.now().diff(DateTime.fromJSDate(dto.after));

    return {
      needsFullSync: duration > AUDIT_LOG_MAX_DURATION,
      ids: audits,
    };
  }

  async getChecksums(dto: FileChecksumDto) {
    const results: FileChecksumResponseDto[] = [];
    for (const filename of dto.filenames) {
      if (!StorageCore.isImmichPath(filename)) {
        throw new BadRequestException(
          `Could not get the checksum of ${filename} because the file isn't accessible by Immich`,
        );
      }

      const checksum = await this.cryptoRepository.hashFile(filename);
      results.push({ filename, checksum: checksum.toString('base64') });
    }
    return results;
  }

  async fixItems(items: FileReportItemDto[]) {
    for (const { entityId: id, pathType, pathValue } of items) {
      if (!StorageCore.isImmichPath(pathValue)) {
        throw new BadRequestException(
          `Could not fix item ${id} with path ${pathValue} because the file isn't accessible by Immich`,
        );
      }

      switch (pathType) {
        case AssetPathType.ENCODED_VIDEO: {
          await this.assetRepository.update({ id, encodedVideoPath: pathValue });
          break;
        }

        case AssetPathType.PREVIEW: {
          await this.assetRepository.upsertFile({ assetId: id, type: AssetFileType.PREVIEW, path: pathValue });
          break;
        }

        case AssetPathType.THUMBNAIL: {
          await this.assetRepository.upsertFile({ assetId: id, type: AssetFileType.THUMBNAIL, path: pathValue });
          break;
        }

        case AssetPathType.ORIGINAL: {
          await this.assetRepository.update({ id, originalPath: pathValue });
          break;
        }

        case AssetPathType.SIDECAR: {
          await this.assetRepository.update({ id, sidecarPath: pathValue });
          break;
        }

        case PersonPathType.FACE: {
          await this.personRepository.update({ id, thumbnailPath: pathValue });
          break;
        }

        case UserPathType.PROFILE: {
          await this.userRepository.update(id, { profileImagePath: pathValue });
          break;
        }
      }
    }
  }

  private fullPath(filename: string) {
    return resolve(filename);
  }

  async getFileReport() {
    const hasFile = (items: Set<string>, filename: string) => items.has(filename) || items.has(this.fullPath(filename));
    const crawl = async (folder: StorageFolder) =>
      new Set(
        await this.storageRepository.crawl({
          includeHidden: true,
          pathsToCrawl: [StorageCore.getBaseFolder(folder)],
        }),
      );

    const uploadFiles = await crawl(StorageFolder.UPLOAD);
    const libraryFiles = await crawl(StorageFolder.LIBRARY);
    const thumbFiles = await crawl(StorageFolder.THUMBNAILS);
    const videoFiles = await crawl(StorageFolder.ENCODED_VIDEO);
    const profileFiles = await crawl(StorageFolder.PROFILE);
    const allFiles = new Set<string>();
    for (const list of [libraryFiles, thumbFiles, videoFiles, profileFiles, uploadFiles]) {
      for (const item of list) {
        allFiles.add(item);
      }
    }

    const track = (filename: string | null | undefined) => {
      if (!filename) {
        return;
      }
      allFiles.delete(filename);
      allFiles.delete(this.fullPath(filename));
    };

    this.logger.log(
      `Found ${libraryFiles.size} original files, ${thumbFiles.size} thumbnails, ${videoFiles.size} encoded videos, ${profileFiles.size} profile files`,
    );
    const pagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (options) =>
      this.assetRepository.getAll(options, { withDeleted: true, withArchived: true }),
    );

    let assetCount = 0;

    const orphans: FileReportItemDto[] = [];
    for await (const assets of pagination) {
      assetCount += assets.length;
      for (const { id, files, originalPath, encodedVideoPath, isExternal, checksum } of assets) {
        const { previewFile, thumbnailFile } = getAssetFiles(files);
        for (const file of [originalPath, previewFile?.path, encodedVideoPath, thumbnailFile?.path]) {
          track(file);
        }

        const entity = { entityId: id, entityType: PathEntityType.ASSET, checksum: checksum.toString('base64') };
        if (
          originalPath &&
          !hasFile(libraryFiles, originalPath) &&
          !hasFile(uploadFiles, originalPath) &&
          // Android motion assets
          !hasFile(videoFiles, originalPath) &&
          // ignore external library assets
          !isExternal
        ) {
          orphans.push({ ...entity, pathType: AssetPathType.ORIGINAL, pathValue: originalPath });
        }
        if (previewFile && !hasFile(thumbFiles, previewFile.path)) {
          orphans.push({ ...entity, pathType: AssetPathType.PREVIEW, pathValue: previewFile.path });
        }
        if (thumbnailFile && !hasFile(thumbFiles, thumbnailFile.path)) {
          orphans.push({ ...entity, pathType: AssetPathType.THUMBNAIL, pathValue: thumbnailFile.path });
        }
        if (encodedVideoPath && !hasFile(videoFiles, encodedVideoPath)) {
          orphans.push({ ...entity, pathType: AssetPathType.THUMBNAIL, pathValue: encodedVideoPath });
        }
      }
    }

    const users = await this.userRepository.getList();
    for (const { id, profileImagePath } of users) {
      track(profileImagePath);

      const entity = { entityId: id, entityType: PathEntityType.USER };
      if (profileImagePath && !hasFile(profileFiles, profileImagePath)) {
        orphans.push({ ...entity, pathType: UserPathType.PROFILE, pathValue: profileImagePath });
      }
    }

    const personPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.personRepository.getAll(pagination),
    );
    for await (const people of personPagination) {
      for (const { id, thumbnailPath } of people) {
        track(thumbnailPath);
        const entity = { entityId: id, entityType: PathEntityType.PERSON };
        if (thumbnailPath && !hasFile(thumbFiles, thumbnailPath)) {
          orphans.push({ ...entity, pathType: PersonPathType.FACE, pathValue: thumbnailPath });
        }
      }

      this.logger.log(`Found ${assetCount} assets, ${users.length} users, ${people.length} people`);
    }

    const extras: string[] = [];
    for (const file of allFiles) {
      extras.push(file);
    }

    // send as absolute paths
    for (const orphan of orphans) {
      orphan.pathValue = this.fullPath(orphan.pathValue);
    }

    return { orphans, extras };
  }
}
