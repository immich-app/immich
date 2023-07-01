import * as fs from 'fs';

export class CryptoService {
  public async hashFile(pathToHash: string): Promise<string> {
    const crypto = require('crypto');

    const hash = crypto.createHash('sha1');

    const sha1 = (filePath: string) =>
      new Promise<string>((resolve, reject) => {
        const rs = fs.createReadStream(pathToHash);
        rs.on('error', reject);
        rs.on('data', (chunk) => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('hex')));
      });

    return sha1(pathToHash);
  }
}
