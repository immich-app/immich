import { BaseCommand } from '../cli/base-command';
import { UploadTarget } from '../cores';
import { CrawlService, UploadService } from '../services';
import * as si from 'systeminformation';
import FormData from 'form-data';
import { UploadOptionsDto } from '../cores/dto/upload-options-dto';
import { exit } from 'process';
import { AxiosError } from 'axios';

export default class Upload extends BaseCommand {
  private crawlService = new CrawlService();
  private uploadService!: UploadService;
  deviceId!: string;
  uploadCounter: number = 0;
  uploadLength!: number;

  public async run(paths: string[], options: UploadOptionsDto): Promise<void> {
    await this.connect();

    const uuid = await si.uuid();
    this.deviceId = uuid.os || 'CLI';
    this.uploadService = new UploadService(this.immichApi.apiConfiguration);

    const crawledFiles: string[] = await this.crawlService.crawl(paths, options.recursive);

    const uploadTargets = crawledFiles.map((path) => new UploadTarget(path));

    this.uploadLength = uploadTargets.length;

    for (const target of uploadTargets) {
      if (options.import) {
        await this.importTarget(target);
      } else {
        await this.uploadTarget(target, options.skipHash);
      }
    }

    if (options.import) {
      console.log('Import successful');
    } else if (options.delete) {
      console.log('Upload successful, deleting uploaded assets');
      let deletionCounter: number = 0;

      for (const target of uploadTargets) {
        await target.delete();
        deletionCounter++;
        console.log(deletionCounter + '/' + this.uploadLength + ' deleted: ' + target.path);
      }
      console.log('Process complete');
    } else {
      console.log('Upload successful');
    }
  }

  private async uploadTarget(target: UploadTarget, skipHash: boolean) {
    await target.read();

    let skipUpload: boolean = false;
    if (skipHash) {
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

      await this.uploadService.upload(uploadFormData);
      this.uploadCounter++;
      let finishMessage: string;
      if (skipUpload) {
        finishMessage = ' skipped: ';
      } else {
        finishMessage = ' uploaded: ';
      }
      console.log(this.uploadCounter + '/' + this.uploadLength + finishMessage + target.path);
    }
  }

  private async importTarget(target: UploadTarget) {
    await target.import();

    const importData = {
      assetPath: target.path,
      deviceAssetId: target.deviceAssetId,
      assetType: target.assetType,
      deviceId: this.deviceId,
      fileCreatedAt: target.fileCreatedAt,
      fileModifiedAt: target.fileModifiedAt,
      isFavorite: false,
    };

    await this.uploadService.import(importData);

    this.uploadCounter++;
    console.log(this.uploadCounter + '/' + this.uploadLength + ' imported: ' + target.path);
  }
}
