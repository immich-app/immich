import { IsOptional, IsString, IsBoolean } from 'class-validator';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { CreateAssetDto, UploadFile } from './create-asset.dto';

export class ImportAssetDto extends CreateAssetDto {
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean = true;

  @IsString()
  assetData!: string;

  @IsString()
  @IsOptional()
  livePhotoData?: string;

  @IsString()
  @IsOptional()
  sidecarData?: string;
}

export async function mapToImportFile(filepath: string): Promise<UploadFile> {
  const pathInfo = path.parse(filepath);

  const checksum = await new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filepath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });

  return {
    checksum: Buffer.from(checksum, 'utf-8'),
    mimeType: mime.lookup(filepath) as string,
    originalPath: filepath,
    originalName: pathInfo.name,
  };
}
