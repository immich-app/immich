import { AssetTable } from 'src/schema/tables/asset.table';
import { TagTable } from 'src/schema/tables/tag.table';
import { UserTable } from 'src/schema/tables/user.table';
import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Index,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
} from 'src/sql-tools';

@Table({ name: 'family_member' })
@Index({ columns: ['ownerId', 'name'], unique: true })
export class FamilyMemberTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  ownerId!: string;

  @ForeignKeyColumn(() => TagTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  tagId!: string;

  @Column()
  name!: string;

  @Column({ type: 'date' })
  birthdate!: string;

  @Column({ type: 'character varying', length: 7, nullable: true })
  color!: string | null;

  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'SET NULL', nullable: true })
  avatarAssetId!: string | null;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
