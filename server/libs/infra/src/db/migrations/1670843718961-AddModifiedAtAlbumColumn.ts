import { MigrationInterface, QueryRunner } from "typeorm";

export class AddModifiedAtAlbumColumn1670843718961 implements MigrationInterface {
    name = 'AddModifiedAtAlbumColumn1670843718961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "modifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "modifiedAt"`);
    }

}
