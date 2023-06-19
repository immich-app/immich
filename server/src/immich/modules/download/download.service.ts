import { asHumanReadable, HumanReadableSize } from '@app/domain';
import { AssetEntity } from '@app/infra/entities';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, StreamableFile } from '@nestjs/common';
import archiver from 'archiver';
import { extname } from 'path';

export interface DownloadArchive {
  stream: StreamableFile;
  fileName: string;
  fileSize: number;
  fileCount: number;
  complete: boolean;
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
      let fileCount = 0;
      let complete = true;

      for (const { originalPath, exifInfo, originalFileName } of assets) {
        const name = `${originalFileName}${extname(originalPath)}`;
        archive.file(originalPath, { name });
        totalSize += Number(exifInfo?.fileSizeInByte || 0);
        fileCount++;

        // for easier testing, can be changed before merging.
        if (totalSize > HumanReadableSize.GiB * 20) {
          complete = false;
          this.logger.log(
            `Archive size exceeded after ${fileCount} files, capping at ${totalSize} bytes (${asHumanReadable(
              totalSize,
            )})`,
          );
          break;
        }
      }

      archive.finalize();

      return {
        stream,
        fileName: `${name}.zip`,
        fileSize: totalSize,
        fileCount,
        complete,
      };
    } catch (error) {
      this.logger.error(`Error creating download archive ${error}`);
      throw new InternalServerErrorException(`Failed to download ${name}: ${error}`, 'DownloadArchive');
    }
  }
}
