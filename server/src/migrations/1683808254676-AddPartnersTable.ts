import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPartnersTable1683808254676 implements MigrationInterface {
    name = 'AddPartnersTable1683808254676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "partners" ("sharedById" uuid NOT NULL, "sharedWithId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1cc8f73d16b367f426261a8736" PRIMARY KEY ("sharedById", "sharedWithId"))`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_7e077a8b70b3530138610ff5e04"`);
        await queryRunner.query(`DROP TABLE "partners"`);
    }

}
