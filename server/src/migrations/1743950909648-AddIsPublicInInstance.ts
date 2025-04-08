import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsPublicInInstanceForAlbum1743177138612 implements MigrationInterface {
    name = 'AddIsPublicInInstanceForAlbum1743177138612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "isPublicInInstance" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "isPublicInInstance"`);
    }
}
