import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { resolve } from 'node:path';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { AccessCore, Permission } from 'src/cores/access.core';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import {
  AuditDeletesDto,
  AuditDeletesResponseDto,
  FileChecksumDto,
  FileChecksumResponseDto,
  FileReportItemDto,
  PathEntityType,
} from 'src/dtos/audit.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { DatabaseAction } from 'src/entities/audit.entity';
import { AssetPathType, PersonPathType, UserPathType } from 'src/entities/move.entity';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { IAuditRepository } from 'src/interfaces/audit.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { JOBS_ASSET_PAGINATION_SIZE, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class AuditService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(IAuditRepository) private repository: IAuditRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
    this.logger.setContext(AuditService.name);
  }

  async handleCleanup(): Promise<JobStatus> {
    await this.repository.removeBefore(DateTime.now().minus(AUDIT_LOG_MAX_DURATION).toJSDate());
    return JobStatus.SUCCESS;
  }

  async getDeletes(auth: AuthDto, dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    const userId = dto.userId || auth.user.id;
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, userId);

    const audits = await this.repository.getAfter(dto.after, {
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
          await this.assetRepository.update({ id, previewPath: pathValue });
          break;
        }

        case AssetPathType.THUMBNAIL: {
          await this.assetRepository.update({ id, thumbnailPath: pathValue });
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

    const track = (filename: string | null) => {
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
      for (const { id, originalPath, previewPath, encodedVideoPath, thumbnailPath, isExternal, checksum } of assets) {
        for (const file of [originalPath, previewPath, encodedVideoPath, thumbnailPath]) {
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
        if (previewPath && !hasFile(thumbFiles, previewPath)) {
          orphans.push({ ...entity, pathType: AssetPathType.PREVIEW, pathValue: previewPath });
        }
        if (thumbnailPath && !hasFile(thumbFiles, thumbnailPath)) {
          orphans.push({ ...entity, pathType: AssetPathType.THUMBNAIL, pathValue: thumbnailPath });
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
