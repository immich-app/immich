import crypto from 'crypto';
import FormData from 'form-data';
import * as fs from 'graceful-fs';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import Os from 'os';

export class Asset {
  readonly path: string;
  readonly deviceId!: string;

  deviceAssetId?: string;
  fileCreatedAt?: string;
  fileModifiedAt?: string;
  sidecarPath?: string;
  fileSize!: number;
  albumName?: string;

  constructor(path: string) {
    this.path = path;
  }

  async prepare() {
    const stats = await fs.promises.stat(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replace(/\s+/g, '');
    this.fileCreatedAt = stats.mtime.toISOString();
    this.fileModifiedAt = stats.mtime.toISOString();
    this.fileSize = stats.size;
    this.albumName = this.extractAlbumName();
  }

  getUploadFormData(): FormData {
    if (!this.deviceAssetId) throw new Error('Device asset id not set');
    if (!this.fileCreatedAt) throw new Error('File created at not set');
    if (!this.fileModifiedAt) throw new Error('File modified at not set');

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    let sidecarData: fs.ReadStream | undefined = undefined;
    try {
      fs.accessSync(sideCarPath, fs.constants.R_OK);
      sidecarData = createReadStream(sideCarPath);
    } catch (error) {}

    const data: any = {
      assetData: createReadStream(this.path),
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

    if (sidecarData) {
      formData.append('sidecarData', sidecarData);
    }

    return formData;
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
