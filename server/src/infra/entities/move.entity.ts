import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('move_history')
// path lock (per entity)
@Unique('UQ_entityId_pathType', ['entityId', 'pathType'])
// new path lock (global)
@Unique('UQ_newPath', ['newPath'])
export class MoveEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  entityId!: string;

  @Column({ type: 'varchar' })
  pathType!: PathType;

  @Column({ type: 'varchar' })
  oldPath!: string;

  @Column({ type: 'varchar' })
  newPath!: string;
}

export enum AssetPathType {
  ORIGINAL = 'original',
  JPEG_THUMBNAIL = 'jpeg_thumbnail',
  WEBP_THUMBNAIL = 'webp_thumbnail',
  ENCODED_VIDEO = 'encoded_video',
  SIDECAR = 'sidecar',
}

export enum PersonPathType {
  FACE = 'face',
}

export type PathType = AssetPathType | PersonPathType;
