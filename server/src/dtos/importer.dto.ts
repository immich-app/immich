import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum ImporterPlatform {
  DARWIN_ARM64 = 'darwin-arm64',
  DARWIN_AMD64 = 'darwin-amd64',
  LINUX_AMD64 = 'linux-amd64',
  WINDOWS_AMD64 = 'windows-amd64',
}

export class SetupTokenResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresAt!: Date;
}

export class ImporterConfigResponseDto {
  @ApiProperty()
  serverUrl!: string;

  @ApiProperty()
  apiKey!: string;

  @ApiProperty()
  oauth!: {
    clientId: string;
    clientSecret: string;
  };
}

export class GetBootstrapDto {
  @IsEnum(ImporterPlatform)
  @IsNotEmpty()
  @ApiProperty({ enum: ImporterPlatform })
  platform!: ImporterPlatform;
}

export class GetConfigDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  token!: string;
}

// Internal interface for token storage
export interface SetupTokenData {
  userId: string;
  apiKeyId: string;
  apiKeySecret: string;
  serverUrl: string;
  createdAt: Date;
  expiresAt: Date;
}
