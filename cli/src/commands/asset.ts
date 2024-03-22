import {
  AssetBulkUploadCheckResult,
  addAssetsToAlbum,
  checkBulkUpload,
  createAlbum,
  defaults,
  getAllAlbums,
  getSupportedMediaTypes,
} from '@immich/sdk';
import byteSize from 'byte-size';
import cliProgress from 'cli-progress';
import { chunk, zip } from 'lodash-es';
import { createHash } from 'node:crypto';
import fs, { createReadStream } from 'node:fs';
import { access, constants, lstat, stat, unlink } from 'node:fs/promises';
import os from 'node:os';
import path, { basename } from 'node:path';
import { BaseOptions, authenticate, crawl } from 'src/utils';

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

    // XMP sidecars can come in two filename formats. For a photo named photo.ext, the filenames are photo.ext.xmp and photo.xmp
    const assetPath = path.parse(this.path);
    const assetPathWithoutExt = path.join(assetPath.dir, assetPath.name);
    const sidecarPathWithoutExt = `${assetPathWithoutExt}.xmp`;
    const sideCarPathWithExt = `${this.path}.xmp`;

    const [sideCarWithExtExists, sideCarWithoutExtExists] = await Promise.all([
      access(sideCarPathWithExt, constants.R_OK)
        .then(() => true)
        .catch(() => false),
      access(sidecarPathWithoutExt, constants.R_OK)
        .then(() => true)
        .catch(() => false),
    ]);

    let sidecarPath = undefined;
    if (sideCarWithExtExists) {
      sidecarPath = sideCarPathWithExt;
    } else if (sideCarWithoutExtExists) {
      sidecarPath = sidecarPathWithoutExt;
    }

    let sidecarData: Blob | undefined = undefined;
    if (sidecarPath) {
      try {
        sidecarData = new File([await fs.openAsBlob(sidecarPath)], basename(sidecarPath));
      } catch {}
    }

    const data: any = {
      assetData: new File([await fs.openAsBlob(this.path)], basename(this.path)),
      deviceAssetId: this.deviceAssetId,
      deviceId: 'CLI',
      fileCreatedAt: this.fileCreatedAt.toISOString(),
      fileModifiedAt: this.fileModifiedAt.toISOString(),
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

  async hash(): Promise<string> {
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

interface UploadOptionsDto {
  recursive?: boolean;
  exclusionPatterns?: string[];
  dryRun?: boolean;
  skipHash?: boolean;
  delete?: boolean;
  album?: boolean;
  albumName?: string;
  includeHidden?: boolean;
  concurrency: number;
}

export const upload = async (paths: string[], baseOptions: BaseOptions, uploadOptions: UploadOptionsDto) => {
  await authenticate(baseOptions);

  console.log('Crawling for assets...');

  const inputFiles: string[] = [];
  for (const pathArgument of paths) {
    const fileStat = await lstat(pathArgument);
    if (fileStat.isFile()) {
      inputFiles.push(pathArgument);
    }
  }

  const { image, video } = await getSupportedMediaTypes();
  const files = await crawl({
    pathsToCrawl: paths,
    recursive: uploadOptions.recursive,
    exclusionPatterns: uploadOptions.exclusionPatterns,
    includeHidden: uploadOptions.includeHidden,
    extensions: [...image, ...video],
  });

  files.push(...inputFiles);

  if (files.length === 0) {
    console.log('No assets found, exiting');
    return;
  }

  return new UploadCommand().run(files, uploadOptions);
};

// TODO refactor this
class UploadCommand {
  async run(files: string[], options: UploadOptionsDto): Promise<void> {
    const { concurrency, dryRun } = options;
    const assetsToCheck = files.map((path) => new Asset(path));

    const { newAssets, duplicateAssets } = await this.checkAssets(assetsToCheck, concurrency);

    const totalSizeUploaded = await this.upload(newAssets, options);
    const messageStart = dryRun ? 'Would have' : 'Successfully';
    if (newAssets.length === 0) {
      console.log('All assets were already uploaded, nothing to do.');
    } else {
      console.log(
        `${messageStart} uploaded ${newAssets.length} asset${newAssets.length === 1 ? '' : 's'} (${byteSize(totalSizeUploaded)})`,
      );
    }

    if (options.album || options.albumName) {
      const { createdAlbumCount, updatedAssetCount } = await this.updateAlbums(
        [...newAssets, ...duplicateAssets],
        options,
      );
      console.log(`${messageStart} created ${createdAlbumCount} new album${createdAlbumCount === 1 ? '' : 's'}`);
      console.log(`${messageStart} updated ${updatedAssetCount} asset${updatedAssetCount === 1 ? '' : 's'}`);
    }

    if (!options.delete) {
      return;
    }

    if (dryRun) {
      console.log(`Would now have deleted assets, but skipped due to dry run`);
      return;
    }

    console.log('Deleting assets that have been uploaded...');

    await this.deleteAssets(newAssets, options);
  }

  async checkAssets(
    assetsToCheck: Asset[],
    concurrency: number,
  ): Promise<{ newAssets: Asset[]; duplicateAssets: Asset[]; rejectedAssets: Asset[] }> {
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
    const rejectedAssets = [];
    try {
      for (const assets of chunk(assetsToCheck, concurrency)) {
        const checkedAssets = await this.getStatus(assets);
        for (const checked of checkedAssets) {
          if (checked.status === CheckResponseStatus.ACCEPT) {
            newAssets.push(checked.asset);
          } else if (checked.status === CheckResponseStatus.DUPLICATE) {
            duplicateAssets.push(checked.asset);
          } else {
            rejectedAssets.push(checked.asset);
          }
          checkProgress.increment();
        }
      }
    } finally {
      checkProgress.stop();
    }

    return { newAssets, duplicateAssets, rejectedAssets };
  }

  async upload(assetsToUpload: Asset[], { dryRun, concurrency }: UploadOptionsDto): Promise<number> {
    let totalSize = 0;

    // Compute total size first
    for (const asset of assetsToUpload) {
      totalSize += asset.fileSize ?? 0;
    }

    if (dryRun) {
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
      for (const assets of chunk(assetsToUpload, concurrency)) {
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

  async updateAlbums(
    assets: Asset[],
    options: UploadOptionsDto,
  ): Promise<{ createdAlbumCount: number; updatedAssetCount: number }> {
    const { dryRun, concurrency } = options;

    if (options.albumName) {
      for (const asset of assets) {
        asset.albumName = options.albumName;
      }
    }

    const albums = await getAllAlbums({});
    const existingAlbums = new Map(albums.map((album) => [album.albumName, album.id]));

    const assetsToUpdate = assets.filter(
      (asset): asset is Asset & { albumName: string; id: string } => !!(asset.albumName && asset.id),
    );

    const newAlbumsSet: Set<string> = new Set();
    for (const asset of assetsToUpdate) {
      if (!existingAlbums.has(asset.albumName)) {
        newAlbumsSet.add(asset.albumName);
      }
    }

    const newAlbums = [...newAlbumsSet];

    if (dryRun) {
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
      for (const albumNames of chunk(newAlbums, concurrency)) {
        const newAlbumIds = await Promise.all(
          albumNames.map((albumName: string) => createAlbum({ createAlbumDto: { albumName } }).then((r) => r.id)),
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
        for (const assetBatch of chunk(assets, Math.min(1000 * concurrency, 65_000))) {
          await addAssetsToAlbum({ id: albumId, bulkIdsDto: { ids: assetBatch } });
          albumUpdateProgress.increment(assetBatch.length);
        }
      }
    } finally {
      albumUpdateProgress.stop();
    }

    return { createdAlbumCount: newAlbums.length, updatedAssetCount: assetsToUpdate.length };
  }

  async deleteAssets(assets: Asset[], options: UploadOptionsDto): Promise<void> {
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

    const responses = [];
    for (const [check, asset] of zipDefined(checkResponse, assets)) {
      if (check.assetId) {
        asset.id = check.assetId;
      }

      if (check.action === 'accept') {
        responses.push({ asset, status: CheckResponseStatus.ACCEPT });
      } else if (check.reason === 'duplicate') {
        responses.push({ asset, status: CheckResponseStatus.DUPLICATE });
      } else {
        responses.push({ asset, status: CheckResponseStatus.REJECT });
      }
    }

    return responses;
  }

  private async checkHashes(assetsToCheck: Asset[]): Promise<AssetBulkUploadCheckResult[]> {
    const checksums = await Promise.all(assetsToCheck.map((asset) => asset.hash()));
    const assetBulkUploadCheckDto = {
      assets: zipDefined(assetsToCheck, checksums).map(([asset, checksum]) => ({ id: asset.path, checksum })),
    };
    const checkResponse = await checkBulkUpload({ assetBulkUploadCheckDto });
    return checkResponse.results;
  }

  private async uploadAssets(assets: Asset[]): Promise<string[]> {
    const fileRequests = await Promise.all(assets.map((asset) => asset.getUploadFormData()));
    const results = await Promise.all(fileRequests.map((request) => this.uploadAsset(request)));
    return results.map((response) => response.id);
  }

  private async uploadAsset(data: FormData): Promise<{ id: string }> {
    const { baseUrl, headers } = defaults;

    const response = await fetch(`${baseUrl}/asset/upload`, {
      method: 'post',
      redirect: 'error',
      headers: headers as Record<string, string>,
      body: data,
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(await response.text());
    }
    return response.json();
  }
}
