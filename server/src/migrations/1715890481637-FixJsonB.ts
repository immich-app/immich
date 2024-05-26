import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixJsonB1715890481637 implements MigrationInterface {
  name = 'FixJsonB1715890481637';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "system_metadata" ALTER COLUMN "value" DROP DEFAULT`);
    const records = await queryRunner.query('SELECT "key", "value" FROM "system_metadata"');
    for (const { key, value } of records) {
      await queryRunner.query(`UPDATE "system_metadata" SET "value" = $1 WHERE "key" = $2`, [value, key]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "system_metadata" ALTER COLUMN "value" SET DEFAULT '{}'`);
    const records = await queryRunner.query('SELECT "key", "value" FROM "system_metadata"');
    for (const { key, value } of records) {
      await queryRunner.query(`UPDATE "system_metadata" SET "value" = $1 WHERE "key" = $2`, [
        JSON.stringify(JSON.stringify(value)),
        key,
      ]);
    }
  }
}
