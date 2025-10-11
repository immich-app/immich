import { Equals, IsInt, IsPositive, IsString } from 'class-validator';
import { Session } from 'src/database';
import { Permission } from 'src/enum';
import { Optional, ValidateBoolean, ValidateEnum } from 'src/validation';

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
  @Equals(true)
  isPendingSyncReset?: true;
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
  @ValidateEnum({ enum: Permission, name: 'Permission', each: true })
  permissions!: Permission[];
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
  permissions: entity.permissions,
});
