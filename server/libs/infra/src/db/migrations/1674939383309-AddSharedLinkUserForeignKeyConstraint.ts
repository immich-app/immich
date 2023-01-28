import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSharedLinkUserForeignKeyConstraint1674939383309 implements MigrationInterface {
  name = 'AddSharedLinkUserForeignKeyConstraint1674939383309';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "shared_links" where "userId" IS NULL`);
    await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "shared_links" ADD "userId" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "shared_links" ADD CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340"`);
    await queryRunner.query(`ALTER TABLE "shared_links" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "shared_links" ADD "userId" character varying NOT NULL`);
  }
}
