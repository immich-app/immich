import { BaseCommand } from '../cli/base-command';
import { CrawledAsset } from '../cores/models/crawled-asset';
import { CrawlService, UploadService } from '../services';
import * as si from 'systeminformation';
import FormData from 'form-data';
import { UploadOptionsDto } from '../cores/dto/upload-options-dto';
import { CrawlOptionsDto } from '../cores/dto/crawl-options-dto';

import cliProgress from 'cli-progress';
import byteSize from 'byte-size';

export default class Upload extends BaseCommand {
  private crawlService = new CrawlService();
  private uploadService!: UploadService;
  deviceId!: string;
  uploadLength!: number;
  dryRun = false;

  public async run(paths: string[], options: UploadOptionsDto): Promise<void> {
    await this.connect();

    const uuid = await si.uuid();
    this.deviceId = uuid.os || 'CLI';
    this.uploadService = new UploadService(this.immichApi.apiConfiguration);

    this.dryRun = options.dryRun;

    const crawlOptions = new CrawlOptionsDto();
    crawlOptions.pathsToCrawl = paths;
    crawlOptions.recursive = options.recursive;
    crawlOptions.excludePatterns = options.excludePatterns;

    const crawledFiles: string[] = await this.crawlService.crawl(crawlOptions);

    if (crawledFiles.length === 0) {
      console.log('No assets found, exiting');
      return;
    }

    const assetsToUpload = crawledFiles.map((path) => new CrawledAsset(path));

    const uploadProgress = new cliProgress.SingleBar(
      {
        format: '{bar} | {percentage}% | ETA: {eta_formatted} | {value_formatted}/{total_formatted}: {filename}',
      },
      cliProgress.Presets.shades_classic,
    );

    let totalSize = 0;
    let sizeSoFar = 0;

    let totalSizeUploaded = 0;
    let uploadCounter = 0;

    for (const asset of assetsToUpload) {
      // Compute total size first
      await asset.process();
      totalSize += asset.fileSize;
    }

    uploadProgress.start(totalSize, 0);
    uploadProgress.update({ value_formatted: 0, total_formatted: byteSize(totalSize) });

    for (const asset of assetsToUpload) {
      uploadProgress.update({
        filename: asset.path,
      });

      try {
        if (options.import) {
          const importData = {
            assetPath: asset.path,
            deviceAssetId: asset.deviceAssetId,
            deviceId: this.deviceId,
            fileCreatedAt: asset.fileCreatedAt,
            fileModifiedAt: asset.fileModifiedAt,
            isFavorite: false,
          };

          if (!this.dryRun) {
            await this.uploadService.import(importData);
          }
        } else {
          await this.uploadAsset(asset, options.skipHash);
        }
      } catch (error) {
        uploadProgress.stop();
        throw error;
      }

      sizeSoFar += asset.fileSize;
      if (!asset.skipped) {
        totalSizeUploaded += asset.fileSize;
        uploadCounter++;
      }

      uploadProgress.update(sizeSoFar, { value_formatted: byteSize(sizeSoFar) });
    }

    uploadProgress.stop();

    let messageStart;
    if (this.dryRun) {
      messageStart = 'Would have ';
    } else {
      messageStart = 'Successfully ';
    }

    if (options.import) {
      console.log(`${messageStart} imported ${uploadCounter} assets (${byteSize(totalSizeUploaded)})`);
    } else {
      if (uploadCounter === 0) {
        console.log('All assets were already uploaded, nothing to do.');
      } else {
        console.log(`${messageStart} uploaded ${uploadCounter} assets (${byteSize(totalSizeUploaded)})`);
      }
      if (options.delete) {
        if (this.dryRun) {
          console.log(`Would now have deleted assets, but skipped due to dry run`);
        } else {
          console.log('Deleting assets that have been uploaded...');
          const deletionProgress = new cliProgress.SingleBar(cliProgress.Presets.shades_classic);
          deletionProgress.start(crawledFiles.length, 0);

          for (const asset of assetsToUpload) {
            if (!this.dryRun) {
              await asset.delete();
            }
            deletionProgress.increment();
          }
          deletionProgress.stop();
          console.log('Deletion complete');
        }
      }
    }
  }

  private async uploadAsset(asset: CrawledAsset, skipHash = false) {
    await asset.readData();

    let skipUpload = false;
    if (!skipHash) {
      const checksum = await asset.hash();

      const checkResponse = await this.uploadService.checkIfAssetAlreadyExists(asset.path, checksum);
      skipUpload = checkResponse.data.results[0].action === 'reject';
    }

    if (skipUpload) {
      asset.skipped = true;
    } else {
      const uploadFormData = new FormData();

      uploadFormData.append('deviceAssetId', asset.deviceAssetId);
      uploadFormData.append('deviceId', this.deviceId);
      uploadFormData.append('fileCreatedAt', asset.fileCreatedAt);
      uploadFormData.append('fileModifiedAt', asset.fileModifiedAt);
      uploadFormData.append('isFavorite', String(false));
      uploadFormData.append('assetData', asset.assetData, { filename: asset.path });

      if (asset.sidecarData) {
        uploadFormData.append('sidecarData', asset.sidecarData, {
          filename: asset.sidecarPath,
          contentType: 'application/xml',
        });
      }

      if (!this.dryRun) {
        await this.uploadService.upload(uploadFormData);
      }
    }
  }
}
