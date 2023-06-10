import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { CreateAssetDto } from './create-asset.dto';

export class ImportAssetDto extends CreateAssetDto {
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean = true;

  @ApiProperty()
  @IsString()
  assetData!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  livePhotoData?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  sidecarData?: string;
}

export interface ImportFile {
  mimeType: string;
  checksum: Buffer;
  originalPath: string;
  originalName: string;
}

export async function mapToImportFile(filepath: string): Promise<ImportFile> {
  const pathInfo = path.parse(filepath);
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);

  return {
    checksum: Buffer.from(hashSum.digest('hex'), 'utf-8'),
    mimeType: mime.lookup(filepath) as string,
    originalPath: filepath,
    originalName: pathInfo.name,
  };
}
