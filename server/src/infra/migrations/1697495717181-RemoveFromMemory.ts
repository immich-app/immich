import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFromMemory1697495717181 implements MigrationInterface {
    name = 'RemoveFromMemory1697495717181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" ADD "isShownInMemory" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "isShownInMemory"`);
    }

}
