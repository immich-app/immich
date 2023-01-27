import { MigrationInterface, QueryRunner } from "typeorm"

export class TruncateAPIKeys1674774248319 implements MigrationInterface {
    name = 'TruncateAPIKeys1674774248319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE TABLE "api_keys"`);
    }

    public async down(): Promise<void> {
        //noop
    }

}
