import { BaseCommand } from '../cli/base-command';
import { CrawledAsset } from '../cores';
import { CrawlService, UploadService } from '../services';
import * as si from 'systeminformation';
import FormData from 'form-data';
import { UploadOptionsDto } from '../cores/dto/upload-options-dto';
import { CrawlOptionsDto } from '../cores/dto/crawl-options-dto';

export default class Upload extends BaseCommand {
  private crawlService = new CrawlService();
  private uploadService!: UploadService;
  deviceId!: string;
  uploadCounter = 0;
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

    this.uploadLength = assetsToUpload.length;

    const cliProgress = require('cli-progress');
    const byteSize = require('byte-size');

    const progressBar = new cliProgress.SingleBar(
      {
        format: '{bar} | {percentage}% | ETA: {eta_formatted} | {value_formatted}/{total_formatted}: {filename}',
      },
      cliProgress.Presets.shades_classic,
    );

    let totalSize = 0;
    let currentSize = 0;

    for (const asset of assetsToUpload) {
      // Compute total size first
      await asset.process();
      totalSize += asset.fileSize;
    }

    progressBar.start(totalSize);

    for (const asset of assetsToUpload) {
      if (this.uploadCounter === 0) {
        progressBar.update(0, {
          filename: asset.path,
          value_formatted: 0,
          total_formatted: byteSize(totalSize),
        });
      }
      try {
        if (options.import) {
          await this.importAsset(asset);
        } else {
          await this.uploadAsset(asset, options.skipHash);
        }
      } catch (error) {
        progressBar.stop();
        throw error;
      }
      currentSize += asset.fileSize;

      progressBar.update(currentSize, { filename: asset.path, value_formatted: byteSize(currentSize) });
    }

    progressBar.stop();

    if (options.import) {
      console.log('Import successful');
    } else if (options.delete) {
      console.log('Upload successful, deleting uploaded assets');
      let deletionCounter = 0;

      for (const asset of assetsToUpload) {
        if (this.dryRun) {
          deletionCounter++;
          console.log(deletionCounter + '/' + this.uploadLength + ' would have been deleted: ' + asset.path);
        } else {
          await asset.delete();
          deletionCounter++;
          console.log(deletionCounter + '/' + this.uploadLength + ' deleted: ' + asset.path);
        }
      }

      console.log('Process complete');
    } else {
      console.log('Upload successful');
    }
  }

  private async uploadAsset(asset: CrawledAsset, skipHash = false) {
    await asset.readData();

    let skipUpload = false;
    if (!skipHash) {
      const checksum: string = await asset.hash();

      const checkResponse = await this.uploadService.checkIfAssetAlreadyExists(asset.path, checksum);
      skipUpload = checkResponse.data.results[0].action === 'reject';
    }

    if (!skipUpload) {
      const uploadFormData = new FormData();

      uploadFormData.append('assetType', asset.assetType);
      uploadFormData.append('assetData', asset.assetData, { filename: asset.path });
      uploadFormData.append('deviceAssetId', asset.deviceAssetId);
      uploadFormData.append('deviceId', this.deviceId);
      uploadFormData.append('fileCreatedAt', asset.fileCreatedAt);
      uploadFormData.append('fileModifiedAt', asset.fileModifiedAt);
      uploadFormData.append('isFavorite', String(false));
      uploadFormData.append('fileExtension', asset.fileExtension);

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

    this.uploadCounter++;
  }

  private async importAsset(asset: CrawledAsset) {
    const importData = {
      assetPath: asset.path,
      deviceAssetId: asset.deviceAssetId,
      assetType: asset.assetType,
      deviceId: this.deviceId,
      fileCreatedAt: asset.fileCreatedAt,
      fileModifiedAt: asset.fileModifiedAt,
      isFavorite: false,
    };

    if (!this.dryRun) {
      await this.uploadService.import(importData);
    }
    this.uploadCounter++;
  }
}
