import { MigrationInterface, QueryRunner } from "typeorm";

export class FaceRecognitionUpdates1682571392440 implements MigrationInterface {
    name = 'FaceRecognitionUpdates1682571392440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" SET DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "thumbnailPath" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "name" DROP DEFAULT`);
    }

}
