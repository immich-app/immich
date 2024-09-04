import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOriginalFileNameIndex1705306747072 implements MigrationInterface {
  name = 'AddOriginalFileNameIndex1705306747072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_4d66e76dada1ca180f67a205dc" ON "assets" ("originalFileName") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_4d66e76dada1ca180f67a205dc"`);
  }
}
