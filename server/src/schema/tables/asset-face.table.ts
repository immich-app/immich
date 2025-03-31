import { SourceType } from 'src/enum';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { Column, DeleteDateColumn, ForeignKeyColumn, Index, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table({ name: 'asset_faces' })
@Index({ name: 'IDX_asset_faces_assetId_personId', columns: ['assetId', 'personId'] })
@Index({ columns: ['personId', 'assetId'] })
export class AssetFaceTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ default: 0, type: 'integer' })
  imageWidth!: number;

  @Column({ default: 0, type: 'integer' })
  imageHeight!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX1!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY1!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxX2!: number;

  @Column({ default: 0, type: 'integer' })
  boundingBoxY2!: number;

  @Column({ default: SourceType.MACHINE_LEARNING, enumName: 'sourcetype', enum: SourceType })
  sourceType!: SourceType;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  assetId!: string;

  @ForeignKeyColumn(() => PersonTable, { onDelete: 'SET NULL', onUpdate: 'CASCADE', nullable: true })
  personId!: string | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
