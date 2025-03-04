import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveHistoryUuidEntityId1741179334403 implements MigrationInterface {
  name = 'MoveHistoryUuidEntityId1741179334403';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "move_history" ALTER COLUMN "entityId" TYPE uuid USING "entityId"::uuid;`);
    await queryRunner.query(`delete from "move_history"
      where
        "move_history"."entityId" not in (
          select
            "id"
          from
            "assets"
          where
            "assets"."id" = "move_history"."entityId"
        )
        and "move_history"."pathType" = 'original'
  `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "move_history" ALTER COLUMN "entityId" TYPE character varying`);
  }
}

