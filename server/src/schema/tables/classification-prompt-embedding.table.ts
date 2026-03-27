import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { ClassificationCategoryTable } from 'src/schema/tables/classification-category.table';

@Table('classification_prompt_embedding')
export class ClassificationPromptEmbeddingTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => ClassificationCategoryTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  categoryId!: string;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'vector', length: 512, storage: 'external', synchronize: false })
  embedding!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
