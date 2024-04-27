import { SessionEntity } from 'src/entities/session.entity';

export class SessionResponseDto {
  id!: string;
  createdAt!: string;
  updatedAt!: string;
  current!: boolean;
  deviceType!: string;
  deviceOS!: string;
}

export const mapSession = (entity: SessionEntity, currentId?: string): SessionResponseDto => ({
  id: entity.id,
  createdAt: entity.createdAt.toISOString(),
  updatedAt: entity.updatedAt.toISOString(),
  current: currentId === entity.id,
  deviceOS: entity.deviceOS,
  deviceType: entity.deviceType,
});
