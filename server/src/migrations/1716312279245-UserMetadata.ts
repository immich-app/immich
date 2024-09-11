import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserMetadata1716312279245 implements MigrationInterface {
  name = 'UserMetadata1716312279245';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_metadata" ("userId" uuid NOT NULL, "key" character varying NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_5931462150b3438cbc83277fe5a" PRIMARY KEY ("userId", "key"))`,
    );
    const users = await queryRunner.query('SELECT "id", "memoriesEnabled", "avatarColor" FROM "users"');
    for (const { id, memoriesEnabled, avatarColor } of users) {
      const preferences: any = {};
      if (!memoriesEnabled) {
        preferences.memories = { enabled: false };
      }

      if (avatarColor) {
        preferences.avatar = { color: avatarColor };
      }

      if (Object.keys(preferences).length === 0) {
        continue;
      }

      await queryRunner.query('INSERT INTO "user_metadata" ("userId", "key", "value") VALUES ($1, $2, $3)', [
        id,
        'preferences',
        preferences,
      ]);
    }
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "memoriesEnabled"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarColor"`);
    await queryRunner.query(
      `ALTER TABLE "user_metadata" ADD CONSTRAINT "FK_6afb43681a21cf7815932bc38ac" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_metadata" DROP CONSTRAINT "FK_6afb43681a21cf7815932bc38ac"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatarColor" character varying`);
    await queryRunner.query(`ALTER TABLE "users" ADD "memoriesEnabled" boolean NOT NULL DEFAULT true`);
    const items = await queryRunner.query(
      `SELECT "userId" as "id", "value" FROM "user_metadata" WHERE "key"='preferences'`,
    );
    for (const { id, value } of items) {
      if (!value) {
        continue;
      }

      if (value.avatar?.color) {
        await queryRunner.query(`UPDATE "users" SET "avatarColor" = $1 WHERE "id" = $2`, [value.avatar.color, id]);
      }

      if (value.memories?.enabled === false) {
        await queryRunner.query(`UPDATE "users" SET "memoriesEnabled" = false WHERE "id" = $1`, [id]);
      }
    }
    await queryRunner.query(`DROP TABLE "user_metadata"`);
  }
}
