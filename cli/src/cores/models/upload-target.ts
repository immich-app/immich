import { AssetTypeEnum } from 'immich-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { basename } from 'node:path';
import * as path from 'path';
import crypto from 'crypto';

export class UploadTarget {
  public path: string;

  public assetType?: AssetTypeEnum;
  public assetData?: Buffer;
  public deviceAssetId?: string;
  public fileCreatedAt?: string;
  public fileModifiedAt?: string;
  public fileExtension?: string;
  public sidecarData?: Buffer;
  public sidecarPath?: string;

  constructor(path: string) {
    this.path = path;
  }

  async read() {
    this.assetData = await fs.promises.readFile(this.path);
    await this.process();
  }

  async import() {
    await this.process();
  }

  private async process() {
    const stats = fs.statSync(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replace(/\s+/g, '');

    // TODO: Determine file type from extension only
    const mimeType = mime.lookup(this.path);
    if (!mimeType) {
      throw Error('Cannot determine mime type of asset: ' + this.path);
    }
    this.assetType = mimeType.split('/')[0].toUpperCase() as AssetTypeEnum;
    this.fileCreatedAt = stats.ctime.toISOString();
    this.fileModifiedAt = stats.mtime.toISOString();
    this.fileExtension = path.extname(this.path);
    let hasSidecar = true;

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    try {
      fs.accessSync(sideCarPath, fs.constants.R_OK);
    } catch (error) {
      // No sidecar file
      hasSidecar = false;
    }
    if (hasSidecar) {
      this.sidecarPath = `${this.path}.xmp`;
      this.sidecarData = await fs.promises.readFile(this.sidecarPath);
    }
  }

  async delete(): Promise<void> {
    return fs.promises.unlink(this.path);
  }

  public async hash(): Promise<string> {
    const hash = crypto.createHash('sha1');

    const sha1 = (filePath: string) =>
      new Promise<string>((resolve, reject) => {
        const rs = fs.createReadStream(filePath);
        rs.on('error', reject);
        rs.on('data', (chunk) => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('hex')));
      });

    return await sha1(this.path);
  }
}
