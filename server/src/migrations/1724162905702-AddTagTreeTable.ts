import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagTreeTable1724162905702 implements MigrationInterface {
    name = 'AddTagTreeTable1724162905702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "tags" CASCADE');
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "value" character varying NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "parentId" uuid, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_eab38eb12a3ec6df8376c95477c" PRIMARY KEY ("id_ancestor", "id_descendant"))`);
        await queryRunner.query(`CREATE INDEX "IDX_15fbcbc67663c6bfc07b354c22" ON "tags_closure" ("id_ancestor") `);
        await queryRunner.query(`CREATE INDEX "IDX_b1a2a7ed45c29179b5ad51548a" ON "tags_closure" ("id_descendant") `);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_9f9590cc11561f1f48ff034ef99" FOREIGN KEY ("parentId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_15fbcbc67663c6bfc07b354c22c" FOREIGN KEY ("id_ancestor") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags_closure" ADD CONSTRAINT "FK_b1a2a7ed45c29179b5ad51548a1" FOREIGN KEY ("id_descendant") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
   }

    public async down(): Promise<void> {
      // not implemented
    }
}
