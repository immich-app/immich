import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFacialTables1684255168091 implements MigrationInterface {
    name = 'AddFacialTables1684255168091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "person" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ownerId" uuid NOT NULL, "name" character varying NOT NULL DEFAULT '', "thumbnailPath" character varying NOT NULL DEFAULT '', CONSTRAINT "PK_5fdaf670315c4b7e70cce85daa3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "asset_faces" ("assetId" uuid NOT NULL, "personId" uuid NOT NULL, "embedding" real array, CONSTRAINT "PK_bf339a24070dac7e71304ec530a" PRIMARY KEY ("assetId", "personId"))`);
        await queryRunner.query(`ALTER TABLE "person" ADD CONSTRAINT "FK_5527cc99f530a547093f9e577b6" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "asset_faces" ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9"`);
        await queryRunner.query(`ALTER TABLE "asset_faces" DROP CONSTRAINT "FK_02a43fd0b3c50fb6d7f0cb7282c"`);
        await queryRunner.query(`ALTER TABLE "person" DROP CONSTRAINT "FK_5527cc99f530a547093f9e577b6"`);
        await queryRunner.query(`DROP TABLE "asset_faces"`);
        await queryRunner.query(`DROP TABLE "person"`);
    }

}
