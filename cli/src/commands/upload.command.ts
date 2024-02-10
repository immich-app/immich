import byteSize from 'byte-size';
import cliProgress from 'cli-progress';
import fs, { createReadStream } from 'node:fs';
import { CrawlService } from '../services/crawl.service';
import { BaseCommand } from './base-command';
import { basename } from 'node:path';
import { access, constants, stat, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { ImmichApi } from 'src/services/api.service';

class Asset {
  readonly path: string;
  readonly deviceId!: string;

  deviceAssetId?: string;
  fileCreatedAt?: Date;
  fileModifiedAt?: Date;
  sidecarPath?: string;
  fileSize!: number;
  albumName?: string;

  constructor(path: string) {
    this.path = path;
  }

  async prepare() {
    const stats = await stat(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replaceAll(/\s+/g, '');
    this.fileCreatedAt = stats.mtime;
    this.fileModifiedAt = stats.mtime;
    this.fileSize = stats.size;
    this.albumName = this.extractAlbumName();
  }

  async getUploadFormData(): Promise<FormData> {
    if (!this.deviceAssetId) {
      throw new Error('Device asset id not set');
    }
    if (!this.fileCreatedAt) {
      throw new Error('File created at not set');
    }
    if (!this.fileModifiedAt) {
      throw new Error('File modified at not set');
    }

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    let sidecarData: Blob | undefined = undefined;
    try {
      await access(sideCarPath, constants.R_OK);
      sidecarData = new File([await fs.openAsBlob(sideCarPath)], basename(sideCarPath));
    } catch {}

    const data: any = {
      assetData: new File([await fs.openAsBlob(this.path)], basename(this.path)),
      deviceAssetId: this.deviceAssetId,
      deviceId: 'CLI',
      fileCreatedAt: this.fileCreatedAt,
      fileModifiedAt: this.fileModifiedAt,
      isFavorite: String(false),
    };
    const formData = new FormData();

    for (const property in data) {
      formData.append(property, data[property]);
    }

    if (sidecarData) {
      formData.append('sidecarData', sidecarData);
    }

    return formData;
  }

  async delete(): Promise<void> {
    return unlink(this.path);
  }

  public async hash(): Promise<string> {
    const sha1 = (filePath: string) => {
      const hash = createHash('sha1');
      return new Promise<string>((resolve, reject) => {
        const rs = createReadStream(filePath);
        rs.on('error', reject);
        rs.on('data', (chunk) => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('hex')));
      });
    };

    return await sha1(this.path);
  }

  private extractAlbumName(): string | undefined {
    return os.platform() === 'win32' ? this.path.split('\\').at(-2) : this.path.split('/').at(-2);
  }
}

export class UploadOptionsDto {
  recursive? = false;
  exclusionPatterns?: string[] = [];
  dryRun? = false;
  skipHash? = false;
  delete? = false;
  album? = false;
  albumName? = '';
  includeHidden? = false;
}

export class UploadCommand extends BaseCommand {
  uploadLength!: number;

  public async run(paths: string[], options: UploadOptionsDto): Promise<void> {
    const api = await this.connect();

    const formatResponse = await api.getSupportedMediaTypes();
    const crawlService = new CrawlService(formatResponse.image, formatResponse.video);

    const inputFiles: string[] = [];
    for (const pathArgument of paths) {
      const fileStat = await fs.promises.lstat(pathArgument);
      if (fileStat.isFile()) {
        inputFiles.push(pathArgument);
      }
    }

    const files: string[] = await crawlService.crawl({
      pathsToCrawl: paths,
      recursive: options.recursive,
      exclusionPatterns: options.exclusionPatterns,
      includeHidden: options.includeHidden,
    });

    files.push(...inputFiles);

    if (files.length === 0) {
      console.log('No assets found, exiting');
      return;
    }

    const assetsToUpload = files.map((path) => new Asset(path));

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
      await asset.prepare();
      totalSize += asset.fileSize;

      if (options.albumName) {
        asset.albumName = options.albumName;
      }
    }

    const existingAlbums = await api.getAllAlbums();

    uploadProgress.start(totalSize, 0);
    uploadProgress.update({ value_formatted: 0, total_formatted: byteSize(totalSize) });

    try {
      for (const asset of assetsToUpload) {
        uploadProgress.update({
          filename: asset.path,
        });

        let skipUpload = false;

        let skipAsset = false;
        let existingAssetId: string | undefined = undefined;

        if (!options.skipHash) {
          const assetBulkUploadCheckDto = { assets: [{ id: asset.path, checksum: await asset.hash() }] };

          const checkResponse = await api.checkBulkUpload(assetBulkUploadCheckDto);

          skipUpload = checkResponse.results[0].action === 'reject';

          const isDuplicate = checkResponse.results[0].reason === 'duplicate';
          if (isDuplicate) {
            existingAssetId = checkResponse.results[0].assetId;
          }

          skipAsset = skipUpload && !isDuplicate;
        }

        if (!skipAsset && !options.dryRun) {
          if (!skipUpload) {
            const formData = await asset.getUploadFormData();
            const response = await this.uploadAsset(api, formData);
            const json = await response.json();
            existingAssetId = json.id;
            uploadCounter++;
            totalSizeUploaded += asset.fileSize;
          }

          if ((options.album || options.albumName) && asset.albumName !== undefined) {
            let album = existingAlbums.find((album) => album.albumName === asset.albumName);
            if (!album) {
              const response = await api.createAlbum({ albumName: asset.albumName });
              album = response;
              existingAlbums.push(album);
            }

            if (existingAssetId) {
              await api.addAssetsToAlbum(album.id, {
                ids: [existingAssetId],
              });
            }
          }
        }

        sizeSoFar += asset.fileSize;

        uploadProgress.update(sizeSoFar, { value_formatted: byteSize(sizeSoFar) });
      }
    } finally {
      uploadProgress.stop();
    }

    const messageStart = options.dryRun ? 'Would have' : 'Successfully';

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
        deletionProgress.start(files.length, 0);

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

  private async uploadAsset(api: ImmichApi, data: FormData): Promise<Response> {
    const url = api.instanceUrl + '/asset/upload';

    const response = await fetch(url, {
      method: 'post',
      redirect: 'error',
      headers: {
        'x-api-key': api.apiKey,
      },
      body: data,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(await response.text());
    }
    return response;
  }
}
