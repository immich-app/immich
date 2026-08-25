import { BadRequestException, Injectable } from '@nestjs/common';
import { AssetFileResponseDto, AssetFileSearchDto, mapAssetFile } from 'src/dtos/asset-file.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetFileType, CacheControl, JobName, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { getFilenameExtension, getFileNameWithoutExtension, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';
import { findOrFail } from 'src/utils/misc';

@Injectable()
export class AssetFileService extends BaseService {
  async search(auth: AuthDto, dto: AssetFileSearchDto): Promise<AssetFileResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.assetId] });
    const files = await this.assetFileRepository.search(dto);
    return files.map((file) => mapAssetFile(file));
  }

  async get(auth: AuthDto, id: string): Promise<AssetFileResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetFileRead, ids: [id] });
    const file = await findOrFail(() => this.assetFileRepository.get(id), 'Asset file');
    return mapAssetFile(file);
  }

  async download(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.AssetFileDownload, ids: [id] });
    const file = await findOrFail(() => this.assetFileRepository.get(id), 'Asset file');

    return new ImmichFileResponse({
      path: file.path,
      fileName: getFileNameWithoutExtension(file.path) + getFilenameExtension(file.path),
      contentType: mimeTypes.lookup(file.path),
      cacheControl: CacheControl.PrivateWithCache,
    });
  }

  async delete(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.AssetFileDelete, ids: [id] });

    const file = await findOrFail(() => this.assetFileRepository.get(id), 'Asset file');
    // TODO consider implications of allowing sidecar files to be deleted
    if (file.type === AssetFileType.Sidecar) {
      throw new BadRequestException('Sidecar files cannot be deleted');
    }

    await this.assetFileRepository.delete(id);
    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [file.path] } });
  }
}
