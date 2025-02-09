import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFavoritePerson1734879118272 implements MigrationInterface {
    name = 'AddIsFavoritePerson1734879118272'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" ADD "isFavorite" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "isFavorite"`);
    }

}
