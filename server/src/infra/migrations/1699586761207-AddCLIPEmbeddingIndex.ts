import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCLIPEmbeddingIndex1699586761207 implements MigrationInterface {
  name = 'AddCLIPEmbeddingIndex1699586761207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Creating CLIP index. This may take a while...');
    await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS clip_index
        ON smart_info
        USING hnsw ("clipEmbedding" vector_ip_ops)
        WITH (m = 16, ef_construction = 128)`);
    await queryRunner.query(`SET hnsw.ef_search = 250`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS clip_index`);
  }
}
