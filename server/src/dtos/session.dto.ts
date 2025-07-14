import { IsInt, IsPositive, IsString } from 'class-validator';
import { Session } from 'src/database';
import { Optional, ValidateBoolean } from 'src/validation';

export class SessionCreateDto {
  /**
   * session duration, in seconds
   */
  @IsInt()
  @IsPositive()
  @Optional()
  duration?: number;

  @IsString()
  @Optional()
  deviceType?: string;

  @IsString()
  @Optional()
  deviceOS?: string;
}

export class SessionUpdateDto {
  @ValidateBoolean({ optional: true })
  isPendingSyncReset?: boolean;
}

export class SessionResponseDto {
  id!: string;
  createdAt!: string;
  updatedAt!: string;
  expiresAt?: string;
  current!: boolean;
  deviceType!: string;
  deviceOS!: string;
  isPendingSyncReset!: boolean;
}

export class SessionCreateResponseDto extends SessionResponseDto {
  token!: string;
}

export const mapSession = (entity: Session, currentId?: string): SessionResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
  expiresAt: entity.expiresAt?.toISOString(),
  current: currentId === entity.id,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
  isPendingSyncReset: entity.isPendingSyncReset,
});
