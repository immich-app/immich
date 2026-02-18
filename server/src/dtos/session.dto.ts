import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsInt, IsPositive, IsString } from 'class-validator';
import { Session } from 'src/database';
import { Optional, ValidateBoolean } from 'src/validation';

export class SessionCreateDto {
  @ApiPropertyOptional({ type: 'number', description: 'Session duration in seconds' })
  @IsInt()
  @IsPositive()
  @Optional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Device type' })
  @IsString()
  @Optional()
  deviceType?: string;

  @ApiPropertyOptional({ description: 'Device OS' })
  @IsString()
  @Optional()
  deviceOS?: string;
}

export class SessionUpdateDto {
  @ValidateBoolean({ optional: true, description: 'Reset pending sync state' })
  @Equals(true)
  isPendingSyncReset?: true;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: string;
  @ApiPropertyOptional({ description: 'Expiration date' })
  expiresAt?: string;
  @ApiProperty({ description: 'Is current session' })
  current!: boolean;
  @ApiProperty({ description: 'Device type' })
  deviceType!: string;
  @ApiProperty({ description: 'Device OS' })
  deviceOS!: string;
  @ApiProperty({ description: 'App version' })
  appVersion!: string | null;
  @ApiProperty({ description: 'Is pending sync reset' })
  isPendingSyncReset!: boolean;
}

export class SessionCreateResponseDto extends SessionResponseDto {
  @ApiProperty({ description: 'Session token' })
  token!: string;
}

export const mapSession = (entity: Session, currentId?: string): SessionResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
  expiresAt: entity.expiresAt?.toISOString(),
  current: currentId === entity.id,
  appVersion: entity.appVersion,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
  isPendingSyncReset: entity.isPendingSyncReset,
});
