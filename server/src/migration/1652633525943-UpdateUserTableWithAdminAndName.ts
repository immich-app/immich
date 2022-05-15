import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserTableWithAdminAndName1652633525943 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      alter table users
          add "firstName" varchar;

      alter table users
          add "lastName" varchar;

      alter table users
          add "isAdmin" bool default false;
      `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        alter table users
          drop column "firstName";

        alter table users
          drop column "lastName";

        alter table users
          drop column "isAdmin";
        
        `);
  }

}
