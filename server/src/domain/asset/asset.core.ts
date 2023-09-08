import { IJobRepository, JobName } from '../job';
import { AuthUserDto } from '../auth';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from './response-dto';
import { AccessCore, Permission } from '../access';
import { IAssetRepository } from './asset.repository';

export class AssetCore {
  constructor(
    private access: AccessCore,
    private assetRepository: IAssetRepository,
    private jobRepository: IJobRepository,
  ) {}

  public async deleteAll(authUser: AuthUserDto, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const deleteQueue: Array<string | null> = [];
    const result: BulkIdResponseDto[] = [];

    const ids = dto.ids.slice();
    for (const id of ids) {
      const hasAccess = await this.access.hasPermission(authUser, Permission.ASSET_DELETE, id);
      if (!hasAccess) {
        result.push({ id, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      const asset = await this.assetRepository.getById(id);
      if (!asset) {
        result.push({ id, success: false, error: BulkIdErrorReason.NOT_FOUND });
        continue;
      }

      try {
        if (asset.faces) {
          await Promise.all(
            asset.faces.map(({ assetId, personId }) =>
              this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId } }),
            ),
          );
        }

        await this.assetRepository.remove(asset);
        await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: [id] } });

        result.push({ id, success: true });

        if (!asset.isReadOnly) {
          deleteQueue.push(
            asset.originalPath,
            asset.webpPath,
            asset.resizePath,
            asset.encodedVideoPath,
            asset.sidecarPath,
          );
        }

        // TODO refactor this to use cascades
        if (asset.livePhotoVideoId && !ids.includes(asset.livePhotoVideoId)) {
          ids.push(asset.livePhotoVideoId);
        }
      } catch {
        result.push({ id, success: false, error: BulkIdErrorReason.UNKNOWN });
      }
    }

    if (deleteQueue.length > 0) {
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: deleteQueue } });
    }

    return result;
  }
}
