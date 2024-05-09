import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNullableRelations1682371561743 implements MigrationInterface {
  name = 'FixNullableRelations1682371561743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_token" DROP CONSTRAINT "FK_d37db50eecdf9b8ce4eedd2f918"`);
    await queryRunner.query(`ALTER TABLE "user_token" ALTER COLUMN "userId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_token" ADD CONSTRAINT "FK_d37db50eecdf9b8ce4eedd2f918" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_token" DROP CONSTRAINT "FK_d37db50eecdf9b8ce4eedd2f918"`);
    await queryRunner.query(`ALTER TABLE "user_token" ALTER COLUMN "userId" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user_token" ADD CONSTRAINT "FK_d37db50eecdf9b8ce4eedd2f918" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
