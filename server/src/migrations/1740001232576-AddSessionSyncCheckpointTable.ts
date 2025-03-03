import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionSyncCheckpointTable1740001232576 implements MigrationInterface {
    name = 'AddSessionSyncCheckpointTable1740001232576'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "session_sync_checkpoints" ("sessionId" uuid NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ack" character varying NOT NULL, CONSTRAINT "PK_b846ab547a702863ef7cd9412fb" PRIMARY KEY ("sessionId", "type"))`);
        await queryRunner.query(`ALTER TABLE "session_sync_checkpoints" ADD CONSTRAINT "FK_d8ddd9d687816cc490432b3d4bc" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`
            create trigger session_sync_checkpoints_updated_at
            before update on session_sync_checkpoints
            for each row execute procedure updated_at()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`drop trigger session_sync_checkpoints_updated_at on session_sync_checkpoints`);
        await queryRunner.query(`ALTER TABLE "session_sync_checkpoints" DROP CONSTRAINT "FK_d8ddd9d687816cc490432b3d4bc"`);
        await queryRunner.query(`DROP TABLE "session_sync_checkpoints"`);
    }

}
