import { UpdateIdColumn } from 'src/decorators';
import { AssetEditAction, AssetEditActionParameter } from 'src/dtos/editing.dto';
import { asset_edit_audit } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AfterDeleteTrigger, Column, ForeignKeyColumn, Generated, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('asset_edit')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_edit_audit,
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

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
