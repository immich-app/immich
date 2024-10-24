import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionStateTable1729792220961 implements MigrationInterface {
    name = 'AddSessionStateTable1729792220961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_sync_states" ("sessionId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "state" jsonb, CONSTRAINT "PK_4821e7414daba4413b8b33546d1" PRIMARY KEY ("sessionId"))`);
        await queryRunner.query(`ALTER TABLE "session_sync_states" ADD CONSTRAINT "FK_4821e7414daba4413b8b33546d1" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session_sync_states" DROP CONSTRAINT "FK_4821e7414daba4413b8b33546d1"`);
        await queryRunner.query(`DROP TABLE "session_sync_states"`);
    }

}
