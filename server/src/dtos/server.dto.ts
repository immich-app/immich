import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { SemVer } from 'semver';

export class ServerPingResponse {
  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}

export class ServerAboutResponseDto {
  @ApiProperty({ description: 'Server version' })
  version!: string;
  @ApiProperty({ description: 'URL to version information' })
  versionUrl!: string;

  @ApiPropertyOptional({ description: 'Repository name' })
  repository?: string;
  @ApiPropertyOptional({ description: 'Repository URL' })
  repositoryUrl?: string;

  @ApiPropertyOptional({ description: 'Source reference (branch/tag)' })
  sourceRef?: string;
  @ApiPropertyOptional({ description: 'Source commit hash' })
  sourceCommit?: string;
  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Build identifier' })
  build?: string;
  @ApiPropertyOptional({ description: 'Build URL' })
  buildUrl?: string;

  @ApiPropertyOptional({ description: 'Node.js version' })
  nodejs?: string;
}

export class ServerVersionResponseDto {
  @ApiProperty({ type: 'integer', description: 'Major version number' })
  major!: number;
  @ApiProperty({ type: 'integer', description: 'Minor version number' })
  minor!: number;
  @ApiProperty({ type: 'integer', description: 'Patch version number' })
  patch!: number;

  static fromSemVer(value: SemVer) {
    return { major: value.major, minor: value.minor, patch: value.patch };
  }
}

export class ServerConfigDto {
  @ApiProperty({ description: 'Login page message' })
  loginPageMessage!: string;
  @ApiProperty({ type: 'integer', description: 'Delay in days before deleted users are permanently removed' })
  userDeleteDelay!: number;
  @ApiProperty({ description: 'Whether the server has been initialized' })
  isInitialized!: boolean;
}

export class ServerFeaturesDto {
  @ApiProperty({ description: 'Whether password login is enabled' })
  passwordLogin!: boolean;
}
