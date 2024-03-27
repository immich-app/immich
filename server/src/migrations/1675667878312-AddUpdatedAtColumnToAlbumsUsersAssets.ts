import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdatedAtColumnToAlbumsUsersAssets1675667878312 implements MigrationInterface {
  name = 'AddUpdatedAtColumnToAlbumsUsersAssets1675667878312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "assets" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
  }
}
