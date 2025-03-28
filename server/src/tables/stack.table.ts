import { ForeignKeyColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';
import { AssetTable } from 'src/tables/asset.table';
import { UserTable } from 'src/tables/user.table';

@Table('asset_stack')
export class StackTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  ownerId!: string;

  //TODO: Add constraint to ensure primary asset exists in the assets array
  @ForeignKeyColumn(() => AssetTable, { nullable: false, unique: true })
  primaryAssetId!: string;
}
