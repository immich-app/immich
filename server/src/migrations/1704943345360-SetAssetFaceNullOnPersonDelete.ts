import { MigrationInterface, QueryRunner } from "typeorm"

export class SetAssetFaceNullOnPersonDelete1704943345360 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "asset_faces"
            DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9",
            ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" 
            FOREIGN KEY ("personId") REFERENCES "person"("id")
            ON DELETE SET NULL ON UPDATE CASCADE
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "asset_faces"
            DROP CONSTRAINT "FK_95ad7106dd7b484275443f580f9",
            ADD CONSTRAINT "FK_95ad7106dd7b484275443f580f9" 
            FOREIGN KEY ("personId") REFERENCES "person"("id")
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

}
