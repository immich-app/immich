import { Asset } from '../cores/models/asset';
import { CrawlService, UploadService } from '../services';
import * as si from 'systeminformation';
import FormData from 'form-data';
import { UploadOptionsDto } from '../cores/dto/upload-options-dto';
import { CrawlOptionsDto } from '../cores/dto/crawl-options-dto';

import cliProgress from 'cli-progress';
import byteSize from 'byte-size';
import { BaseCommand } from '../cli/base-command';

export default class Upload extends BaseCommand {
  private uploadService!: UploadService;
  uploadLength!: number;

  public async run(paths: string[], options: UploadOptionsDto): Promise<void> {
    await this.connect();

    const uuid = await si.uuid();
    this.deviceId = uuid.os || 'CLI';
    this.uploadService = new UploadService(this.immichApi.apiConfiguration);

    const formatResponse = await this.immichApi.serverInfoApi.getSupportedMediaTypes();

    const crawlService = new CrawlService(formatResponse.data.image, formatResponse.data.video);

    const crawlOptions = new CrawlOptionsDto();
    crawlOptions.pathsToCrawl = paths;
    crawlOptions.recursive = options.recursive;
    crawlOptions.exclusionPatterns = options.excludePatterns;

    const crawledFiles: string[] = await crawlService.crawl(crawlOptions);

    if (crawledFiles.length === 0) {
      console.log('No assets found, exiting');
      return;
    }

    const assetsToUpload = crawledFiles.map((path) => new Asset(path));

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

    const existingAlbums = (await this.immichApi.albumApi.getAllAlbums()).data;

    uploadProgress.start(totalSize, 0);
    uploadProgress.update({ value_formatted: 0, total_formatted: byteSize(totalSize) });

    try {
      for (const asset of assetsToUpload) {
        uploadProgress.update({
          filename: asset.path,
        });

        await asset.readData();

        let skipUpload = false;
        if (!options.skipHash) {
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

          if (!options.dryRun) {
            const res = await this.uploadService.upload(uploadFormData);

            if (options.album && asset.albumName) {
              let album = existingAlbums.find((album) => album.albumName === asset.albumName);
              if (!album) {
                const res = await this.immichApi.albumApi.createAlbum({
                  createAlbumDto: { albumName: asset.albumName },
                });
                album = res.data;
                existingAlbums.push(album);
              }

              await this.immichApi.albumApi.addAssetsToAlbum({ id: album.id, bulkIdsDto: { ids: [res.data.id] } });
            }
          }
        }

        sizeSoFar += asset.fileSize;
        if (!asset.skipped) {
          totalSizeUploaded += asset.fileSize;
          uploadCounter++;
        }

        uploadProgress.update(sizeSoFar, { value_formatted: byteSize(sizeSoFar) });
      }
    } finally {
      uploadProgress.stop();
    }

    let messageStart;
    if (options.dryRun) {
      messageStart = 'Would have';
    } else {
      messageStart = 'Successfully';
    }

    if (uploadCounter === 0) {
      console.log('All assets were already uploaded, nothing to do.');
    } else {
      console.log(`${messageStart} uploaded ${uploadCounter} assets (${byteSize(totalSizeUploaded)})`);
    }
    if (options.delete) {
      if (options.dryRun) {
        console.log(`Would now have deleted assets, but skipped due to dry run`);
      } else {
        console.log('Deleting assets that have been uploaded...');
        const deletionProgress = new cliProgress.SingleBar(cliProgress.Presets.shades_classic);
        deletionProgress.start(crawledFiles.length, 0);

        for (const asset of assetsToUpload) {
          if (!options.dryRun) {
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
