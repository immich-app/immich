import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNestedAlbumTable1712161154542 implements MigrationInterface {
    name = 'AddNestedAlbumTable1712161154542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nested_albums" ("parentId" uuid NOT NULL, "childId" uuid NOT NULL, CONSTRAINT "PK_702e1e5d9ed4b85d3bdffc934bd" PRIMARY KEY ("parentId", "childId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "nested_albums"`);
    }

}
