import { MigrationInterface, QueryRunner } from "typeorm";

export class Infra1692906088974 implements MigrationInterface {
    name = 'Infra1692906088974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_token" ADD "authParentId" uuid DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "user_token" ADD CONSTRAINT "FK_b148a32f567215890c16a52d3b8" FOREIGN KEY ("authParentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_token" DROP CONSTRAINT "FK_b148a32f567215890c16a52d3b8"`);
        await queryRunner.query(`ALTER TABLE "user_token" DROP COLUMN "authParentId"`);
    }

}
