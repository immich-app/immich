import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Unique,
} from '@immich/sql-tools';
import { AssetEditAction, AssetEditParameters } from 'src/dtos/editing.dto';
import { asset_edit_delete, asset_edit_insert } from 'src/schema/functions';
import { AssetTable } from 'src/schema/tables/asset.table';

@Table('asset_edit')
@AfterInsertTrigger({ scope: 'statement', function: asset_edit_insert, referencingNewTableAs: 'inserted_edit' })
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_edit_delete,
  referencingOldTableAs: 'deleted_edit',
  when: 'pg_trigger_depth() = 0',
})
@Unique({ columns: ['assetId', 'sequence'] })
export class AssetEditTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => AssetTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', nullable: false })
  assetId!: string;

  @Column()
  action!: AssetEditAction;

  @Column({ type: 'jsonb' })
  parameters!: AssetEditParameters;

  @Column({ type: 'integer' })
  sequence!: number;
}
