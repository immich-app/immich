import { AssetEntity } from '@app/database/entities/asset.entity';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, StreamableFile } from '@nestjs/common';
import archiver from 'archiver';
import { extname } from 'path';

export interface DownloadArchive {
  stream: StreamableFile;
  filename: string;
  filesize: number;
}

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  public async downloadArchive(name: string, assets: AssetEntity[]): Promise<DownloadArchive> {
    if (!assets || assets.length === 0) {
      throw new BadRequestException('No assets to download.');
    }

    try {
      const archive = archiver('zip', { store: true });
      const stream = new StreamableFile(archive);
      let totalSize = 0;

      for (const { id, originalPath, exifInfo } of assets) {
        const name = `${exifInfo?.imageName || id}${extname(originalPath)}`;
        archive.file(originalPath, { name });
        totalSize += Number(exifInfo?.fileSizeInByte || 0);
      }

      archive.finalize();

      return {
        stream,
        filename: `${name}.zip`,
        filesize: totalSize,
      };
    } catch (error) {
      this.logger.error(`Error creating download archive ${error}`);
      throw new InternalServerErrorException(`Failed to download ${name}: ${error}`, 'DownloadArchive');
    }
  }
}
