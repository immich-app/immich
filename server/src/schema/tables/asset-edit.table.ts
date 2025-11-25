import { EditActionParameter, EditActionType } from 'src/dtos/editing.dto';
import { AssetTable } from 'src/schema/tables/asset.table';
import { Column, ForeignKeyColumn } from 'src/sql-tools';

export class AssetEditTable<T extends EditActionType = EditActionType> {
  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false, primary: true })
  assetId!: string;

  @Column()
  action!: T;

  @Column({ type: 'jsonb' })
  parameters!: EditActionParameter[T];

  @Column()
  index!: number;
}
