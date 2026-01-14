import { AssetEditAction, AssetEditActionParameter } from 'src/dtos/editing.dto';
import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn, Generated, PrimaryGeneratedColumn } from 'src/sql-tools';

export class AssetEditTable<T extends AssetEditAction = AssetEditAction> {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  assetId!: string;

  @Column()
  action!: T;

  @Column({ type: 'jsonb' })
  parameters!: AssetEditActionParameter[T];
}
