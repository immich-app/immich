import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeChecksumIndex1679662469076 implements MigrationInterface {
  name = 'removeChecksumIndex1679662469076';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "checksum" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "checksum" DROP NOT NULL`);
  }
}
