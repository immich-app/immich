import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AssetEntity } from './asset.entity';
import { PersonEntity } from './person.entity';

@Entity('asset_faces')
export class AssetFaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AssetEntity, (asset) => asset.faces, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  asset!: AssetEntity;

  @ManyToOne(() => PersonEntity, (person) => person.faces, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  person!: AssetEntity;
}
