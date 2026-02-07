import { BadRequestException, Injectable } from '@nestjs/common';
import { AssetFileResponseDto, AssetFileSearchDto, mapAssetFile } from 'src/dtos/asset-file.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { CacheControl, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { getFilenameExtension, getFileNameWithoutExtension, ImmichFileResponse } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

@Injectable()
export class AssetFileService extends BaseService {
  async search(auth: AuthDto, dto: AssetFileSearchDto): Promise<AssetFileResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.AssetRead, ids: [dto.assetId] });
    const files = await this.assetFileRepository.getByAssetId(dto);
    return files.map((file) => mapAssetFile(file));
  }

  async get(auth: AuthDto, id: string): Promise<AssetFileResponseDto> {
    await this.requireAccess({ auth, permission: Permission.AssetFileRead, ids: [id] });
    const file = await this.findOrFail(id);
    return mapAssetFile(file);
  }

  async download(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.AssetFileDownload, ids: [id] });
    const file = await this.findOrFail(id);

    return new ImmichFileResponse({
      path: file.path,
      fileName: getFileNameWithoutExtension(file.path) + getFilenameExtension(file.path),
      contentType: mimeTypes.lookup(file.path),
      cacheControl: CacheControl.PrivateWithCache,
    });
  }

  async delete(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.AssetFileDelete, ids: [id] });

    await this.assetFileRepository.delete(id);
  }

  private async findOrFail(id: string) {
    const file = await this.assetFileRepository.get(id);
    if (!file) {
      throw new BadRequestException('Asset file not found');
    }
    return file;
  }
}
