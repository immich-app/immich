import { TagEntity } from 'src/entities/tag.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('tags_closure')
export class TagClosureEntity {
  @Index('IDX_15fbcbc67663c6bfc07b354c22')
  @PrimaryColumn('uuid')
  id_ancestor!: string;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_ancestor' })
  ancestor!: TagEntity;

  @Index('IDX_b1a2a7ed45c29179b5ad51548a')
  @PrimaryColumn('uuid')
  id_descendant!: string;

  @ManyToOne(() => TagEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_descendant' })
  descendant!: TagEntity;
}
