import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1645130759468 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
        create table if not exists users
        (
            id          uuid      default uuid_generate_v4() not null
                constraint "PK_a3ffb1c0c8416b9fc6f907b7433"
                    primary key,
            email       varchar                              not null,
            password    varchar                              not null,
            salt        varchar                              not null,
            "createdAt" timestamp default now()              not null
        );
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop table users`);
  }
}
