import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoveTable1696968880063 implements MigrationInterface {
    name = 'AddMoveTable1696968880063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "move_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityId" character varying NOT NULL, "pathType" character varying NOT NULL, "oldPath" character varying NOT NULL, "newPath" character varying NOT NULL, CONSTRAINT "UQ_newPath" UNIQUE ("newPath"), CONSTRAINT "UQ_entityId_pathType" UNIQUE ("entityId", "pathType"), CONSTRAINT "PK_af608f132233acf123f2949678d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "move_history"`);
    }

}
