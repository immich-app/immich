import * as fs from 'fs';
import { basename } from 'node:path';
import crypto from 'crypto';
import { AssetApiUploadFileRequest } from 'src/api/open-api';
import Os from 'os';

export class Asset {
  readonly path: string;
  readonly deviceId!: string;

  assetData?: File;
  deviceAssetId?: string;
  fileCreatedAt?: string;
  fileModifiedAt?: string;
  sidecarData?: File;
  sidecarPath?: string;
  fileSize!: number;
  albumName?: string;

  constructor(path: string, deviceId: string) {
    this.path = path;
    this.deviceId = deviceId;
  }

  async process() {
    const stats = await fs.promises.stat(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replace(/\s+/g, '');
    this.fileCreatedAt = stats.mtime.toISOString();
    this.fileModifiedAt = stats.mtime.toISOString();
    this.fileSize = stats.size;
    this.albumName = this.extractAlbumName();

    this.assetData = await this.getFileObject(this.path);

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    try {
      fs.accessSync(sideCarPath, fs.constants.R_OK);
      this.sidecarData = await this.getFileObject(sideCarPath);
    } catch (error) {}
  }

  getUploadFileRequest(): AssetApiUploadFileRequest {
    if (!this.assetData) throw new Error('Asset data not set');
    if (!this.deviceAssetId) throw new Error('Device asset id not set');
    if (!this.fileCreatedAt) throw new Error('File created at not set');
    if (!this.fileModifiedAt) throw new Error('File modified at not set');
    if (!this.deviceId) throw new Error('Device id not set');

    return {
      assetData: this.assetData,
      deviceAssetId: this.deviceAssetId,
      deviceId: this.deviceId,
      fileCreatedAt: this.fileCreatedAt,
      fileModifiedAt: this.fileModifiedAt,
      isFavorite: false,
      sidecarData: this.sidecarData,
    };
  }

  private async getFileObject(path: string): Promise<File> {
    const buffer = await fs.promises.readFile(path);
    return new File([buffer], basename(path));
  }

  async delete(): Promise<void> {
    return fs.promises.unlink(this.path);
  }

  public async hash(): Promise<string> {
    const sha1 = (filePath: string) => {
      const hash = crypto.createHash('sha1');
      return new Promise<string>((resolve, reject) => {
        const rs = fs.createReadStream(filePath);
        rs.on('error', reject);
        rs.on('data', (chunk) => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('hex')));
      });
    };

    return await sha1(this.path);
  }

  private extractAlbumName(): string {
    if (Os.platform() === 'win32') {
      return this.path.split('\\').slice(-2)[0];
    } else {
      return this.path.split('/').slice(-2)[0];
    }
  }
}
