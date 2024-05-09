import { MigrationInterface, QueryRunner } from "typeorm";

export class CascadeSharedLinksDelete1709825430031 implements MigrationInterface {
    name = 'CascadeSharedLinksDelete1709825430031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340"`);
        await queryRunner.query(`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_links" DROP CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340"`);
        await queryRunner.query(`ALTER TABLE "shared_links" ADD CONSTRAINT "FK_66fe3837414c5a9f1c33ca49340" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
