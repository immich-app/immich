import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOriginalpathIndex1686502271292 implements MigrationInterface {
    name = 'AddOriginalpathIndex1686502271292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_4ed4f8052685ff5b1e7ca1058b" ON "assets" ("originalPath") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4ed4f8052685ff5b1e7ca1058b"`);
    }

}
