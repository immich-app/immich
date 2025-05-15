import { IsInt, IsPositive, IsString } from 'class-validator';
import { Session } from 'src/database';
import { Optional } from 'src/validation';

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

export class SessionResponseDto {
  id!: string;
  createdAt!: string;
  updatedAt!: string;
  current!: boolean;
  deviceType!: string;
  deviceOS!: string;
}

export class SessionCreateResponseDto extends SessionResponseDto {
  token!: string;
}

export const mapSession = (entity: Session, currentId?: string): SessionResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
  current: currentId === entity.id,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
});
