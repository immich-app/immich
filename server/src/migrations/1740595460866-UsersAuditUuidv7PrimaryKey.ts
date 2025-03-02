import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersAuditUuidv7PrimaryKey1740595460866 implements MigrationInterface {
    name = 'UsersAuditUuidv7PrimaryKey1740595460866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_audit_deleted_at_asc_user_id_asc"`);
        await queryRunner.query(`ALTER TABLE "users_audit" DROP CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180"`);
        await queryRunner.query(`ALTER TABLE "users_audit" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users_audit" ADD "id" uuid NOT NULL DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "users_audit" ADD CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users_audit" ALTER COLUMN "deletedAt" SET DEFAULT clock_timestamp()`)
        await queryRunner.query(`CREATE INDEX "IDX_users_audit_deleted_at" ON "users_audit" ("deletedAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_audit_deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users_audit" DROP CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180"`);
        await queryRunner.query(`ALTER TABLE "users_audit" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "users_audit" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users_audit" ADD CONSTRAINT "PK_e9b2bdfd90e7eb5961091175180" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "users_audit" ALTER COLUMN "deletedAt" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_users_audit_deleted_at_asc_user_id_asc" ON "users_audit" ("userId", "deletedAt") `);
    }

}
