import { MigrationInterface, QueryRunner } from "typeorm";

export class SetReadonlyDefault1712905931092 implements MigrationInterface {
    name = 'SetReadonlyDefault1712905931092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ALTER COLUMN "readonly" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums_shared_users_users" ALTER COLUMN "readonly" SET DEFAULT false`);
    }

}
