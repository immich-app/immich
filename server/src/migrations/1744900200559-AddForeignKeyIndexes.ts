import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyIndexes1744900200559 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_0f6fc2fb195f24d19b0fb0d57c" ON "libraries" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_91704e101438fd0653f582426d" ON "asset_stack" ("primaryAssetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_c05079e542fd74de3b5ecb5c1c" ON "asset_stack" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_2c5ac0d6fb58b238fd2068de67" ON "assets" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_16294b83fa8c0149719a1f631e" ON "assets" ("livePhotoVideoId")`);
    await queryRunner.query(`CREATE INDEX "IDX_9977c3c1de01c3d848039a6b90" ON "assets" ("libraryId")`);
    await queryRunner.query(`CREATE INDEX "IDX_f15d48fa3ea5e4bda05ca8ab20" ON "assets" ("stackId")`);
    await queryRunner.query(`CREATE INDEX "IDX_b22c53f35ef20c28c21637c85f" ON "albums" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_05895aa505a670300d4816debc" ON "albums" ("albumThumbnailAssetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_1af8519996fbfb3684b58df280" ON "activity" ("albumId")`);
    await queryRunner.query(`CREATE INDEX "IDX_3571467bcbe021f66e2bdce96e" ON "activity" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_8091ea76b12338cb4428d33d78" ON "activity" ("assetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_6c2e267ae764a9413b863a2934" ON "api_keys" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_5527cc99f530a547093f9e577b" ON "person" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_2bbabe31656b6778c6b87b6102" ON "person" ("faceAssetId")`);
    await queryRunner.query(`CREATE INDEX "IDX_575842846f0c28fa5da46c99b1" ON "memories" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_d7e875c6c60e661723dbf372fd" ON "partners" ("sharedWithId")`);
    await queryRunner.query(`CREATE INDEX "IDX_57de40bc620f456c7311aa3a1e" ON "sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_66fe3837414c5a9f1c33ca4934" ON "shared_links" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_d8ddd9d687816cc490432b3d4b" ON "session_sync_checkpoints" ("sessionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_9f9590cc11561f1f48ff034ef9" ON "tags" ("parentId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_66fe3837414c5a9f1c33ca4934";`);
    await queryRunner.query(`DROP INDEX "IDX_91704e101438fd0653f582426d";`);
    await queryRunner.query(`DROP INDEX "IDX_c05079e542fd74de3b5ecb5c1c";`);
    await queryRunner.query(`DROP INDEX "IDX_5527cc99f530a547093f9e577b";`);
    await queryRunner.query(`DROP INDEX "IDX_2bbabe31656b6778c6b87b6102";`);
    await queryRunner.query(`DROP INDEX "IDX_0f6fc2fb195f24d19b0fb0d57c";`);
    await queryRunner.query(`DROP INDEX "IDX_9f9590cc11561f1f48ff034ef9";`);
    await queryRunner.query(`DROP INDEX "IDX_2c5ac0d6fb58b238fd2068de67";`);
    await queryRunner.query(`DROP INDEX "IDX_16294b83fa8c0149719a1f631e";`);
    await queryRunner.query(`DROP INDEX "IDX_9977c3c1de01c3d848039a6b90";`);
    await queryRunner.query(`DROP INDEX "IDX_f15d48fa3ea5e4bda05ca8ab20";`);
    await queryRunner.query(`DROP INDEX "IDX_b22c53f35ef20c28c21637c85f";`);
    await queryRunner.query(`DROP INDEX "IDX_05895aa505a670300d4816debc";`);
    await queryRunner.query(`DROP INDEX "IDX_57de40bc620f456c7311aa3a1e";`);
    await queryRunner.query(`DROP INDEX "IDX_d8ddd9d687816cc490432b3d4b";`);
    await queryRunner.query(`DROP INDEX "IDX_d7e875c6c60e661723dbf372fd";`);
    await queryRunner.query(`DROP INDEX "IDX_575842846f0c28fa5da46c99b1";`);
    await queryRunner.query(`DROP INDEX "IDX_6c2e267ae764a9413b863a2934";`);
    await queryRunner.query(`DROP INDEX "IDX_1af8519996fbfb3684b58df280";`);
    await queryRunner.query(`DROP INDEX "IDX_3571467bcbe021f66e2bdce96e";`);
    await queryRunner.query(`DROP INDEX "IDX_8091ea76b12338cb4428d33d78";`);
  }
}
