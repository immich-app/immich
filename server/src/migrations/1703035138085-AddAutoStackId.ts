import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoStackId1703035138085 implements MigrationInterface {
    name = 'AddAutoStackId1703035138085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "autoStackId" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_auto_stack_id" ON "exif" ("autoStackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_auto_stack_id"`);
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "autoStackId"`);
    }

}
