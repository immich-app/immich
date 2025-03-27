import { DatabaseExtension } from 'src/enum';
import { createVectorIndex, getVectorExtension } from 'src/repositories/database.repository';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFaceEmbeddingIndex1700714033632 implements MigrationInterface {
  name = 'AddFaceEmbeddingIndex1700714033632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const vectorExtension = await getVectorExtension(queryRunner);
    if (vectorExtension === DatabaseExtension.VECTORS) {
      await queryRunner.query(`SET vectors.pgvector_compatibility=on`);
    }
    await queryRunner.query(`SET search_path TO "$user", public, vectors`);

    await queryRunner.query(createVectorIndex(vectorExtension, 'asset_faces', 'face_index'));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS face_index`);
  }
}
