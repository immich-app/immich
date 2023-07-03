import { BaseCommand } from '../cli/base-command';
import { UploadTarget } from '../cores';
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

    const uploadTargets = crawledFiles.map((path) => new UploadTarget(path));

    this.uploadLength = uploadTargets.length;

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

    for (const target of uploadTargets) {
      // Compute total size first
      await target.process();
      totalSize += target.fileSize;
    }

    progressBar.start(totalSize);

    for (const target of uploadTargets) {
      if (this.uploadCounter === 0) {
        progressBar.update(0, {
          filename: target.path,
          value_formatted: 0,
          total_formatted: byteSize(totalSize),
        });
      }
      try {
        if (options.import) {
          await this.importTarget(target);
        } else {
          await this.uploadTarget(target, options.skipHash);
        }
      } catch (error) {
        progressBar.stop();
        throw error;
      }
      currentSize += target.fileSize;

      progressBar.update(currentSize, { filename: target.path, value_formatted: byteSize(currentSize) });
    }

    progressBar.stop();

    if (options.import) {
      console.log('Import successful');
    } else if (options.delete) {
      console.log('Upload successful, deleting uploaded assets');
      let deletionCounter = 0;

      for (const target of uploadTargets) {
        if (this.dryRun) {
          deletionCounter++;
          console.log(deletionCounter + '/' + this.uploadLength + ' would have been deleted: ' + target.path);
        } else {
          await target.delete();
          deletionCounter++;
          console.log(deletionCounter + '/' + this.uploadLength + ' deleted: ' + target.path);
        }
      }

      console.log('Process complete');
    } else {
      console.log('Upload successful');
    }
  }

  private async uploadTarget(target: UploadTarget, skipHash = false) {
    await target.readData();

    let skipUpload = false;
    if (!skipHash) {
      const checksum: string = await target.hash();

      const checkResponse = await this.uploadService.checkIfAssetAlreadyExists(target.path, checksum);
      skipUpload = checkResponse.data.results[0].action === 'reject';
    }

    if (!skipUpload) {
      const uploadFormData = new FormData();

      uploadFormData.append('assetType', target.assetType);
      uploadFormData.append('assetData', target.assetData, { filename: target.path });
      uploadFormData.append('deviceAssetId', target.deviceAssetId);
      uploadFormData.append('deviceId', this.deviceId);
      uploadFormData.append('fileCreatedAt', target.fileCreatedAt);
      uploadFormData.append('fileModifiedAt', target.fileModifiedAt);
      uploadFormData.append('isFavorite', String(false));
      uploadFormData.append('fileExtension', target.fileExtension);

      if (target.sidecarData) {
        uploadFormData.append('sidecarData', target.sidecarData, {
          filename: target.sidecarPath,
          contentType: 'application/xml',
        });
      }

      if (!this.dryRun) {
        await this.uploadService.upload(uploadFormData);
      }
    }

    this.uploadCounter++;
    let finishMessage: string;
    if (skipUpload) {
      if (this.dryRun) {
        finishMessage = ' would have been skipped: ';
      } else {
        finishMessage = ' skipped: ';
      }
    } else {
      if (this.dryRun) {
        finishMessage = ' would have been uploaded: ';
      } else {
        finishMessage = ' uploaded: ';
      }
    }
    //  console.log(this.uploadCounter + '/' + this.uploadLength + finishMessage + target.path);
  }

  private async importTarget(target: UploadTarget) {
    const importData = {
      assetPath: target.path,
      deviceAssetId: target.deviceAssetId,
      assetType: target.assetType,
      deviceId: this.deviceId,
      fileCreatedAt: target.fileCreatedAt,
      fileModifiedAt: target.fileModifiedAt,
      isFavorite: false,
    };

    if (!this.dryRun) {
      await this.uploadService.import(importData);
    }
    this.uploadCounter++;

    let finishMessage: string;
    if (this.dryRun) {
      finishMessage = ' would have been imported: ';
    } else {
      finishMessage = ' imported: ';
    }

    console.log(this.uploadCounter + '/' + this.uploadLength + finishMessage + target.path);
  }
}
