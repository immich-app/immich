import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNestedAlbumTable1712155807366 implements MigrationInterface {
    name = 'AddNestedAlbumTable1712155807366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nested_albums" ("parentId" character varying NOT NULL, "childId" character varying NOT NULL, CONSTRAINT "PK_702e1e5d9ed4b85d3bdffc934bd" PRIMARY KEY ("parentId", "childId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "nested_albums"`);
    }

}
