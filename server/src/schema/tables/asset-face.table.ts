import { SourceType } from 'src/enum';
import { asset_face_source_type } from 'src/schema/enums';
import { AssetTable } from 'src/schema/tables/asset.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { Column, DeleteDateColumn, ForeignKeyColumn, Index, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table({ name: 'asset_faces' })
@Index({ name: 'IDX_asset_faces_assetId_personId', columns: ['assetId', 'personId'] })
@Index({ columns: ['personId', 'assetId'] })
export class AssetFaceTable {
  @ForeignKeyColumn(() => AssetTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    // [assetId, personId] is the PK constraint
    index: false,
  })
  assetId!: string;

  @ForeignKeyColumn(() => PersonTable, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
    // [personId, assetId] makes this redundant
    index: false,
  })
  personId!: string | null;

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

  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ default: SourceType.MACHINE_LEARNING, enum: asset_face_source_type })
  sourceType!: SourceType;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
