import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAPIKeys1672502270115 implements MigrationInterface {
    name = 'AddAPIKeys1672502270115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "api_keys" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "key" character varying NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "api_keys" ADD CONSTRAINT "FK_6c2e267ae764a9413b863a29342" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT "FK_6c2e267ae764a9413b863a29342"`);
        await queryRunner.query(`DROP TABLE "api_keys"`);
    }

}
