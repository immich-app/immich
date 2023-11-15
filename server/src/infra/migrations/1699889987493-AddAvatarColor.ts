import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarColor1699889987493 implements MigrationInterface {
    name = 'AddAvatarColor1699889987493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatarColor" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarColor"`);
    }

}
