import * as fs from 'graceful-fs';
import { basename } from 'node:path';
import crypto from 'crypto';
import Os from 'os';
import FormData from 'form-data';

export class Asset {
  readonly path: string;
  readonly deviceId!: string;

  assetData?: fs.ReadStream;
  deviceAssetId?: string;
  fileCreatedAt?: string;
  fileModifiedAt?: string;
  sidecarData?: fs.ReadStream;
  sidecarPath?: string;
  fileSize!: number;
  albumName?: string;

  constructor(path: string) {
    this.path = path;
  }

  async process() {
    const stats = await fs.promises.stat(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replace(/\s+/g, '');
    this.fileCreatedAt = stats.mtime.toISOString();
    this.fileModifiedAt = stats.mtime.toISOString();
    this.fileSize = stats.size;
    this.albumName = this.extractAlbumName();

    this.assetData = this.getReadStream(this.path);

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    try {
      fs.accessSync(sideCarPath, fs.constants.R_OK);
      this.sidecarData = this.getReadStream(sideCarPath);
    } catch (error) {}
  }

  getUploadFormData(): FormData {
    if (!this.assetData) throw new Error('Asset data not set');
    if (!this.deviceAssetId) throw new Error('Device asset id not set');
    if (!this.fileCreatedAt) throw new Error('File created at not set');
    if (!this.fileModifiedAt) throw new Error('File modified at not set');

    const data: any = {
      assetData: this.assetData as any,
      deviceAssetId: this.deviceAssetId,
      deviceId: 'CLI',
      fileCreatedAt: this.fileCreatedAt,
      fileModifiedAt: this.fileModifiedAt,
      isFavorite: String(false),
    };
    const formData = new FormData();

    for (const prop in data) {
      formData.append(prop, data[prop]);
    }

    if (this.sidecarData) {
      formData.append('sidecarData', this.sidecarData);
    }

    return formData;
  }

  private getReadStream(path: string): fs.ReadStream {
    return fs.createReadStream(path);
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
