import { Column, CreateDateColumn, PrimaryGeneratedColumn, Table } from 'src/sql-tools';

@Table('asset_ocr')
export class AssetOcrTable {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: 'uuid' })
  assetId!: string;

  @CreateDateColumn()
  text!: string;
}
