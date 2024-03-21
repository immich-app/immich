import { MigrationInterface, QueryRunner } from "typeorm"

export class FixGPSNullIsland1692057328660 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "exif" SET latitude = NULL, longitude = NULL WHERE latitude = 0 AND longitude = 0;`);
    }

    public async down(): Promise<void> {
        // Setting lat,lon to 0 not necessary
    }

}
