import { AssetPathType, DatabaseAction, PersonPathType, UserPathType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { resolve } from 'node:path';
import { AccessCore, Permission } from '../access';
import { AuthDto } from '../auth';
import { AUDIT_LOG_MAX_DURATION } from '../domain.constant';
import { usePagination } from '../domain.util';
import { JOBS_ASSET_PAGINATION_SIZE } from '../job';
import {
  IAccessRepository,
  IAssetRepository,
  IAuditRepository,
  ICryptoRepository,
  IPersonRepository,
  IStorageRepository,
  IUserRepository,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import {
  AuditDeletesDto,
  AuditDeletesResponseDto,
  FileChecksumDto,
  FileChecksumResponseDto,
  FileReportItemDto,
  PathEntityType,
} from './audit.dto';

@Injectable()
export class AuditService {
  private access: AccessCore;
  private logger = new ImmichLogger(AuditService.name);

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(IAuditRepository) private repository: IAuditRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async handleCleanup(): Promise<boolean> {
    await this.repository.removeBefore(DateTime.now().minus(AUDIT_LOG_MAX_DURATION).toJSDate());
    return true;
  }

  async getDeletes(auth: AuthDto, dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    const userId = dto.userId || auth.user.id;
    await this.access.requirePermission(auth, Permission.TIMELINE_READ, userId);

    const audits = await this.repository.getAfter(dto.after, {
      ownerId: userId,
      entityType: dto.entityType,
      action: DatabaseAction.DELETE,
    });

    const duration = DateTime.now().diff(DateTime.fromJSDate(dto.after));

    return {
      needsFullSync: duration > AUDIT_LOG_MAX_DURATION,
      ids: audits.map(({ entityId }) => entityId),
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
          await this.assetRepository.save({ id, encodedVideoPath: pathValue });
          break;
        }

        case AssetPathType.JPEG_THUMBNAIL: {
          await this.assetRepository.save({ id, resizePath: pathValue });
          break;
        }

        case AssetPathType.WEBP_THUMBNAIL: {
          await this.assetRepository.save({ id, webpPath: pathValue });
          break;
        }

        case AssetPathType.ORIGINAL: {
          await this.assetRepository.save({ id, originalPath: pathValue });
          break;
        }

        case AssetPathType.SIDECAR: {
          await this.assetRepository.save({ id, sidecarPath: pathValue });
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
      this.assetRepository.getAll(options, { withDeleted: true }),
    );

    let assetCount = 0;

    const orphans: FileReportItemDto[] = [];
    for await (const assets of pagination) {
      assetCount += assets.length;
      for (const { id, originalPath, resizePath, encodedVideoPath, webpPath, isExternal, checksum } of assets) {
        for (const file of [originalPath, resizePath, encodedVideoPath, webpPath]) {
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
        if (resizePath && !hasFile(thumbFiles, resizePath)) {
          orphans.push({ ...entity, pathType: AssetPathType.JPEG_THUMBNAIL, pathValue: resizePath });
        }
        if (webpPath && !hasFile(thumbFiles, webpPath)) {
          orphans.push({ ...entity, pathType: AssetPathType.WEBP_THUMBNAIL, pathValue: webpPath });
        }
        if (encodedVideoPath && !hasFile(videoFiles, encodedVideoPath)) {
          orphans.push({ ...entity, pathType: AssetPathType.WEBP_THUMBNAIL, pathValue: encodedVideoPath });
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
