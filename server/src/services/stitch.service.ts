import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AuthDto } from 'src/dtos/auth.dto.js';
import { StitchRequestDto } from 'src/dtos/stitch.dto.js';
import { AssetType, CacheControl, Permission } from 'src/enum.js';
import { BaseService } from 'src/services/base.service.js';
import { ImmichFileResponse } from 'src/utils/file.js';
import { stitchImages } from 'src/utils/stitch.js';

@Injectable()
export class StitchService extends BaseService {
  async stitch(auth: AuthDto, dto: StitchRequestDto): Promise<ImmichFileResponse> {
    if (dto.assetIds.length < 2 || dto.assetIds.length > 50) {
      throw new BadRequestException('Send 2..50 image asset IDs');
    }
    await this.requireAccess({ auth, permission: Permission.AssetDownload, ids: dto.assetIds });

    const inputs: Buffer[] = [];
    for (const id of dto.assetIds) {
      const asset = await this.assetRepository.getById(id);
      if (!asset) {
        throw new BadRequestException(`Asset not found: ${id}`);
      }
      if (asset.type !== AssetType.Image) {
        throw new BadRequestException(`Asset is not an image: ${id}`);
      }
      inputs.push(await readFile(asset.originalPath));
    }

    const jpeg = await stitchImages(inputs, dto.mode ?? 'scroll');
    const path = join(tmpdir(), `immich-stitch-${randomUUID()}.jpg`);
    await writeFile(path, jpeg);
    // best effort cleanup after the response has been sent
    setTimeout(() => void unlink(path).catch(() => {}), 60_000).unref?.();

    return new ImmichFileResponse({
      path,
      contentType: 'image/jpeg',
      fileName: `stitched-${Date.now()}.jpg`,
      cacheControl: CacheControl.None,
    });
  }
}
