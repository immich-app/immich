import { OAuthConfig } from '@app/database/entities/system-config.entity';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthSystemConfigResponseDto {
  @ApiProperty({ type: 'boolean' })
  enabled!: boolean;

  @ApiProperty({ type: 'string' })
  issuerUrl!: string;

  @ApiProperty({ type: 'string' })
  clientId!: string;

  @ApiProperty({ type: 'string' })
  clientSecret!: string;

  @ApiProperty({ type: 'string' })
  scope!: string;

  @ApiProperty({ type: 'string' })
  buttonText!: string;

  @ApiProperty({ type: 'boolean' })
  autoRegister!: boolean;
}

export function mapOAuthConfig(config: OAuthConfig): OAuthSystemConfigResponseDto {
  return config;
}
