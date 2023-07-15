import * as fs from 'fs';
import { basename } from 'node:path';
import crypto from 'crypto';

export class CrawledAsset {
  public path: string;

  public assetData?: fs.ReadStream;
  public deviceAssetId?: string;
  public fileCreatedAt?: string;
  public fileModifiedAt?: string;
  public sidecarData?: Buffer;
  public sidecarPath?: string;
  public fileSize!: number;
  public skipped = false;

  constructor(path: string) {
    this.path = path;
  }

  async readData() {
    this.assetData = fs.createReadStream(this.path);
  }

  async process() {
    const stats = await fs.promises.stat(this.path);
    this.deviceAssetId = `${basename(this.path)}-${stats.size}`.replace(/\s+/g, '');
    this.fileCreatedAt = stats.ctime.toISOString();
    this.fileModifiedAt = stats.mtime.toISOString();
    this.fileSize = stats.size;

    // TODO: doesn't xmp replace the file extension? Will need investigation
    const sideCarPath = `${this.path}.xmp`;
    try {
      fs.accessSync(sideCarPath, fs.constants.R_OK);
      this.sidecarData = await fs.promises.readFile(sideCarPath);
      this.sidecarPath = sideCarPath;
    } catch (error) {}
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
}
