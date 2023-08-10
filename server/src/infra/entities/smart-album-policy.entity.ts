import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AlbumEntity } from './album.entity';
import { UserEntity } from './user.entity';

@Entity('smart-album-policies')
export class SmartAlbumPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type!: PolicyType;

  @Column()
  value!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  @Column()
  albumId!: string;

  @Index('IDX_smartAlbumPolicy_albumId')
  @ManyToOne(() => AlbumEntity, (album) => album.policies, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  album!: AlbumEntity;
}

export enum PolicyType {
  PERSON = 'PERSON', // Value is a personId
  LOCATION = 'LOCATION', // Value is the location in text
}
