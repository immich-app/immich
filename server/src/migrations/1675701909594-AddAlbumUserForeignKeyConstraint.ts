import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlbumUserForeignKeyConstraint1675701909594 implements MigrationInterface {
  name = 'AddAlbumUserForeignKeyConstraint1675701909594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "albums" WHERE "ownerId"::uuid NOT IN (SELECT id FROM "users") `)
    await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "ownerId" TYPE varchar(36)`);
    await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "ownerId" TYPE uuid using "ownerId"::uuid`);
    await queryRunner.query(
      `ALTER TABLE "albums" ADD CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_b22c53f35ef20c28c21637c85f4"`);
    await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "ownerId" TYPE character varying`);
  }
}
