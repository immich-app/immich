import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebSocketAttachmentTable1702084989965 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "socket_io_attachments" (id bigserial UNIQUE, created_at timestamptz DEFAULT NOW(), payload bytea);',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "socket_io_attachments"`);
  }
}
