import { AssetEditAction, AssetEditActionParameter } from 'src/dtos/editing.dto';
import { asset_edit_delete, asset_edit_insert } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
} from 'src/sql-tools';

@Table('asset_edit')
@AfterInsertTrigger({ scope: 'row', function: asset_edit_insert })
@AfterDeleteTrigger({
  scope: 'row',
  function: asset_edit_delete,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
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
