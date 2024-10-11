import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { RepairType } from 'src/enum';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('repair')
export class RepairEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AssetFileEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetFile!: AssetFileEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column()
  type!: RepairType;

  @Column()
  path!: string;
}
