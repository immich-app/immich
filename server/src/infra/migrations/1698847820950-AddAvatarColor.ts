import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarColor1698847820950 implements MigrationInterface {
    name = 'AddAvatarColor1698847820950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatarColor" character varying NOT NULL DEFAULT 'primary'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarColor"`);
    }

}
