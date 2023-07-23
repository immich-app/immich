import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectionType1690120705075 implements MigrationInterface {
    name = 'ProjectionType1690120705075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" ADD "projectionType" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exif" DROP COLUMN "projectionType"`);
    }

}
