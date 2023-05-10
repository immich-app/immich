import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePartnerIdColumn1683734723680 implements MigrationInterface {
    name = 'RemovePartnerIdColumn1683734723680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "PK_998645b20820e4ab99aeae03b41"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "PK_f1cc8f73d16b367f426261a8736" PRIMARY KEY ("sharedById", "sharedWithId")`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_7e077a8b70b3530138610ff5e04"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3"`);
        await queryRunner.query(`ALTER TABLE "partners" ALTER COLUMN "sharedById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "partners" ALTER COLUMN "sharedWithId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "FK_7e077a8b70b3530138610ff5e04"`);
        await queryRunner.query(`ALTER TABLE "partners" ALTER COLUMN "sharedWithId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "partners" ALTER COLUMN "sharedById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_d7e875c6c60e661723dbf372fd3" FOREIGN KEY ("sharedWithId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "FK_7e077a8b70b3530138610ff5e04" FOREIGN KEY ("sharedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "partners" DROP CONSTRAINT "PK_f1cc8f73d16b367f426261a8736"`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "partners" ADD CONSTRAINT "PK_998645b20820e4ab99aeae03b41" PRIMARY KEY ("id")`);
    }

}
