import byteSize from 'byte-size';
import cliProgress from 'cli-progress';
import { createHash } from 'node:crypto';
import fs, { createReadStream } from 'node:fs';
import { access, constants, stat, unlink } from 'node:fs/promises';
import os from 'node:os';
import { basename } from 'node:path';
import { ImmichApi } from 'src/services/api.service';
import { CrawlService } from '../services/crawl.service';
import { BaseCommand } from './base-command';
import { chunk, zip } from 'lodash';
import { AssetBulkUploadCheckResult } from '@immich/sdk';

const zipDefined = zip as <T, U>(a: T[], b: U[]) => [T, U][];

enum CheckResponseStatus {
  ACCEPT = 'accept',
  REJECT = 'reject',
  DUPLICATE = 'duplicate',
}

class Asset {
  readonly path: string;

  id?: string;
  deviceAssetId?: string;
  fileCreatedAt?: Date;
  fileModifiedAt?: Date;
  sidecarPath?: string;
  fileSize?: number;
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
  recursive = false;
  exclusionPatterns: string[] = [];
  dryRun = false;
  skipHash = false;
  delete = false;
  album = false;
  albumName = '';
  includeHidden = false;
  concurrency = 4;
}

export class UploadCommand extends BaseCommand {
  uploadLength!: number;

  public async run(paths: string[], options: UploadOptionsDto): Promise<void> {
    await this.connect();

    console.log('Crawling for assets...')
    const files = await this.getFiles(paths, options);

    if (files.length === 0) {
      console.log('No assets found, exiting');
      return;
    }

    const assetsToCheck = files.map((path) => new Asset(path));

    const { newAssets, duplicateAssets } = await this.checkAssets(assetsToCheck, options.concurrency);

    const totalSizeUploaded = await this.upload(newAssets, options);
    const messageStart = options.dryRun ? 'Would have' : 'Successfully';
    if (newAssets.length === 0) {
      console.log('All assets were already uploaded, nothing to do.');
    } else {
      console.log(`${messageStart} uploaded ${newAssets.length} assets (${byteSize(totalSizeUploaded)})`);
    }

    if (!options.album && !options.albumName) {
      return;
    }

    const { createdAlbumCount, updatedAssetCount } = await this.updateAlbums(
      [...newAssets, ...duplicateAssets],
      options,
    );
    console.log(`${messageStart} created ${createdAlbumCount} new albums`);
    console.log(`${messageStart} updated ${updatedAssetCount} assets`);

    if (!options.delete) {
      return;
    }

    if (options.dryRun) {
      console.log(`Would now have deleted assets, but skipped due to dry run`);
      return;
    }

    console.log('Deleting assets that have been uploaded...');

    await this.deleteAssets(newAssets, options);
  }

  public async checkAssets(
    assetsToCheck: Asset[],
    concurrency: number,
  ): Promise<{ newAssets: Asset[]; duplicateAssets: Asset[] }> {
    for (const assets of chunk(assetsToCheck, concurrency)) {
      await Promise.all(assets.map((asset: Asset) => asset.prepare()));
    }

    const checkProgress = new cliProgress.SingleBar(
      { format: 'Checking assets | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} assets' },
      cliProgress.Presets.shades_classic,
    );
    checkProgress.start(assetsToCheck.length, 0);

    const newAssets = [];
    const duplicateAssets = [];
    try {
      for (const assets of chunk(assetsToCheck, concurrency)) {
        const checkedAssets = await this.getStatus(assets);
        for (const checked of checkedAssets) {
          if (checked.status === CheckResponseStatus.ACCEPT) {
            newAssets.push(checked.asset);
          } else if (checked.status === CheckResponseStatus.DUPLICATE) {
            duplicateAssets.push(checked.asset);
          }
          checkProgress.increment();
        }
      }
    } finally {
      checkProgress.stop();
    }

    return { newAssets, duplicateAssets };
  }

  public async upload(assetsToUpload: Asset[], options: UploadOptionsDto): Promise<number> {
    let totalSize = 0;

    // Compute total size first
    for (const asset of assetsToUpload) {
      totalSize += asset.fileSize ?? 0;
    }

    if (options.dryRun) {
      return totalSize;
    }

    const uploadProgress = new cliProgress.SingleBar(
      {
        format: 'Uploading assets | {bar} | {percentage}% | ETA: {eta_formatted} | {value_formatted}/{total_formatted}',
      },
      cliProgress.Presets.shades_classic,
    );
    uploadProgress.start(totalSize, 0);
    uploadProgress.update({ value_formatted: 0, total_formatted: byteSize(totalSize) });

    let totalSizeUploaded = 0;
    try {
      for (const assets of chunk(assetsToUpload, options.concurrency)) {
        const ids = await this.uploadAssets(assets);
        for (const [asset, id] of zipDefined(assets, ids)) {
          asset.id = id;
          if (asset.fileSize) {
            totalSizeUploaded += asset.fileSize ?? 0;
          } else {
            console.log(`Could not determine file size for ${asset.path}`);
          }
        }
        uploadProgress.update(totalSizeUploaded, { value_formatted: byteSize(totalSizeUploaded) });
      }
    } finally {
      uploadProgress.stop();
    }

    return totalSizeUploaded;
  }

  public async getFiles(paths: string[], options: UploadOptionsDto): Promise<string[]> {
    const inputFiles: string[] = [];
    for (const pathArgument of paths) {
      const fileStat = await fs.promises.lstat(pathArgument);
      if (fileStat.isFile()) {
        inputFiles.push(pathArgument);
      }
    }

    const files: string[] = await this.crawl(paths, options);
    files.push(...inputFiles);
    return files;
  }

  public async getAlbums(): Promise<Map<string, string>> {
    const existingAlbums = await this.immichApi.albumApi.getAllAlbums();

    const albumMapping = new Map<string, string>();
    for (const album of existingAlbums) {
      albumMapping.set(album.albumName, album.id);
    }

    return albumMapping;
  }

  public async updateAlbums(
    assets: Asset[],
    options: UploadOptionsDto,
  ): Promise<{ createdAlbumCount: number; updatedAssetCount: number }> {
    if (options.albumName) {
      for (const asset of assets) {
        asset.albumName = options.albumName;
      }
    }

    const existingAlbums = await this.getAlbums();
    const assetsToUpdate = assets.filter(
      (asset): asset is Asset & { albumName: string; id: string } => !!(asset.albumName && asset.id),
    );
    const newAlbums = assetsToUpdate
      .map((asset) => asset.albumName)
      .filter((albumName) => !existingAlbums.has(albumName));

    if (options.dryRun) {
      return { createdAlbumCount: newAlbums.length, updatedAssetCount: assetsToUpdate.length };
    }

    const albumCreationProgress = new cliProgress.SingleBar(
      {
        format: 'Creating albums | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} albums',
      },
      cliProgress.Presets.shades_classic,
    );
    albumCreationProgress.start(newAlbums.length, 0);

    try {
      for (const albumNames of chunk(newAlbums, options.concurrency)) {
        const newAlbumIds = await Promise.all(
          albumNames.map((albumName: string) =>
            this.immichApi.albumApi.createAlbum({ createAlbumDto: { albumName } }).then((r) => r.id),
          ),
        );

        for (const [albumName, albumId] of zipDefined(albumNames, newAlbumIds)) {
          existingAlbums.set(albumName, albumId);
        }

        albumCreationProgress.increment(albumNames.length);
      }
    } finally {
      albumCreationProgress.stop();
    }

    const albumToAssets = new Map<string, string[]>();
    for (const asset of assetsToUpdate) {
      const albumId = existingAlbums.get(asset.albumName);
      if (albumId) {
        if (!albumToAssets.has(albumId)) {
          albumToAssets.set(albumId, []);
        }
        albumToAssets.get(albumId)?.push(asset.id);
      }
    }

    const albumUpdateProgress = new cliProgress.SingleBar(
      {
        format: 'Adding assets to albums | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} assets',
      },
      cliProgress.Presets.shades_classic,
    );
    albumUpdateProgress.start(assetsToUpdate.length, 0);

    try {
      for (const [albumId, assets] of albumToAssets.entries()) {
        for (const assetBatch of chunk(assets, Math.min(1000 * options.concurrency, 65000))) {
          await this.immichApi.albumApi.addAssetsToAlbum({
            id: albumId,
            bulkIdsDto: { ids: assetBatch },
          });
          albumUpdateProgress.increment(assetBatch.length);
        }
      }
    } finally {
      albumUpdateProgress.stop();
    }

    return { createdAlbumCount: newAlbums.length, updatedAssetCount: assetsToUpdate.length };
  }

  public async deleteAssets(assets: Asset[], options: UploadOptionsDto): Promise<void> {
    const deletionProgress = new cliProgress.SingleBar(
      {
        format: 'Deleting local assets | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} assets',
      },
      cliProgress.Presets.shades_classic,
    );
    deletionProgress.start(assets.length, 0);

    try {
      for (const assetBatch of chunk(assets, options.concurrency)) {
        await Promise.all(assetBatch.map((asset: Asset) => asset.delete()));
        deletionProgress.update(assetBatch.length);
      }
    } finally {
      deletionProgress.stop();
    }
  }

  private async getStatus(assets: Asset[]): Promise<{ asset: Asset; status: CheckResponseStatus }[]> {
    const checkResponse = await this.checkHashes(assets);

    const res = [];
    for (const [check, asset] of zipDefined(checkResponse, assets)) {
      if (check.action === 'reject') {
        res.push({ asset, status: CheckResponseStatus.REJECT });
      } else if (check.reason === 'duplicate') {
        if (check.assetId) {
          asset.id = check.assetId;
        }
        res.push({ asset, status: CheckResponseStatus.DUPLICATE });
      } else {
        res.push({ asset, status: CheckResponseStatus.ACCEPT });
      }
    }

    return res;
  }

  private async checkHashes(assetsToCheck: Asset[]): Promise<AssetBulkUploadCheckResult[]> {
    const checksums = await Promise.all(assetsToCheck.map((asset) => asset.hash()));
    const assetBulkUploadCheckDto = {
      assets: zipDefined(assetsToCheck, checksums).map(([asset, checksum]) => ({ id: asset.path, checksum })),
    };
    const checkResponse = await this.immichApi.assetApi.checkBulkUpload({ assetBulkUploadCheckDto });
    return checkResponse.results;
  }

  private async uploadAssets(assets: Asset[]): Promise<string[]> {
    const fileRequests = await Promise.all(assets.map((asset) => asset.getUploadFileRequest()));
    return Promise.all(fileRequests.map((req) => this.immichApi.assetApi.uploadFile(req).then((res) => res.id)));
  }

  private async crawl(paths: string[], options: UploadOptionsDto): Promise<string[]> {
    const formatResponse = await this.immichApi.serverInfoApi.getSupportedMediaTypes();
    const crawlService = new CrawlService(formatResponse.image, formatResponse.video);

    return crawlService.crawl({
      pathsToCrawl: paths,
      recursive: options.recursive,
      exclusionPatterns: options.exclusionPatterns,
      includeHidden: options.includeHidden,
    });
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
