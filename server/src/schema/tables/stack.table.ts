import { AssetTable } from 'src/schema/tables/asset.table';
import { UserTable } from 'src/schema/tables/user.table';
import { ForeignKeyColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

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
