import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUpdateIdColumns1740586617223 implements MigrationInterface {
    name = 'AddUpdateIdColumns1740586617223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        create or replace function immich_uuid_v7(p_timestamp timestamp with time zone default clock_timestamp())
            returns uuid
            as $$
            select encode(
                set_bit(
                  set_bit(
                    overlay(uuid_send(gen_random_uuid())
                            placing substring(int8send(floor(extract(epoch from p_timestamp) * 1000)::bigint) from 3)
                            from 1 for 6
                    ),
                    52, 1
                  ),
                  53, 1
                ),
                'hex')::uuid;
            $$
            language SQL
            volatile;
        `)
      await queryRunner.query(`
          CREATE OR REPLACE FUNCTION updated_at() RETURNS TRIGGER
          LANGUAGE plpgsql
          as $$
          BEGIN
              return new;
          END;
          $$;
        `)
        await queryRunner.query(`ALTER TABLE "person" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "asset_files" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "libraries" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "assets" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "albums" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "session_sync_checkpoints" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "partners" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "memories" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "api_keys" ADD "updateId" uuid`);
        await queryRunner.query(`ALTER TABLE "activity" ADD "updateId" uuid`);

        await queryRunner.query(`UPDATE "person" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "asset_files" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "libraries" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "tags" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "assets" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "users" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "albums" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "sessions" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "session_sync_checkpoints" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "partners" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "memories" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "api_keys" SET "updateId" = immich_uuid_v7("updatedAt")`);
        await queryRunner.query(`UPDATE "activity" SET "updateId" = immich_uuid_v7("updatedAt")`);

        await queryRunner.query(`ALTER TABLE "person" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "asset_files" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "libraries" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "tags" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "assets" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "albums" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "session_sync_checkpoints" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "partners" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "memories" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "api_keys" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);
        await queryRunner.query(`ALTER TABLE "activity" ALTER COLUMN "updateId" SET NOT NULL, ALTER COLUMN "updateId" SET DEFAULT immich_uuid_v7()`);

        await queryRunner.query(`CREATE INDEX "IDX_person_update_id" ON "person" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_asset_files_update_id" ON "asset_files" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_libraries_update_id" ON "libraries" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_tags_update_id" ON "tags" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assets_update_id" ON "assets" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_update_id" ON "users" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_albums_update_id" ON "albums" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_sessions_update_id" ON "sessions" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_session_sync_checkpoints_update_id" ON "session_sync_checkpoints" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_partners_update_id" ON "partners" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_memories_update_id" ON "memories" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_api_keys_update_id" ON "api_keys" ("updateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_activity_update_id" ON "activity" ("updateId")`);

        await queryRunner.query(`
          CREATE OR REPLACE FUNCTION updated_at() RETURNS TRIGGER
          LANGUAGE plpgsql
          as $$
          DECLARE
              clock_timestamp TIMESTAMP := clock_timestamp();
          BEGIN
              new."updatedAt" = clock_timestamp;
              new."updateId" = immich_uuid_v7(clock_timestamp);
              return new;
          END;
          $$;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "memories" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "partners" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "session_sync_checkpoints" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "libraries" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "asset_files" DROP COLUMN "updateId"`);
        await queryRunner.query(`ALTER TABLE "person" DROP COLUMN "updateId"`);
        await queryRunner.query(`DROP FUNCTION immich_uuid_v7`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION updated_at() RETURNS TRIGGER
            LANGUAGE plpgsql
            as $$
            BEGIN
                new."updatedAt" = now();
                return new;
            END;
            $$;
        `)
    }

}
