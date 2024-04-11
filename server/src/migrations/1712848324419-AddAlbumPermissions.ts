import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlbumPermissions1712848324419 implements MigrationInterface {
    name = 'AddAlbumPermissions1712848324419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_427c350ad49bd3935a50baab73"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f48513bf9bccefd6ff3ad30bd0"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ADD "readonly" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "IDX_427c350ad49bd3935a50baab73" ON "albums_shared_users_users" ("albumsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f48513bf9bccefd6ff3ad30bd0" ON "albums_shared_users_users" ("usersId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_f48513bf9bccefd6ff3ad30bd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_427c350ad49bd3935a50baab73"`);
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" DROP COLUMN "readonly"`);
        await queryRunner.query(`CREATE INDEX "IDX_f48513bf9bccefd6ff3ad30bd0" ON "albums_shared_users_users" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_427c350ad49bd3935a50baab73" ON "albums_shared_users_users" ("albumsId") `);
    }

}
