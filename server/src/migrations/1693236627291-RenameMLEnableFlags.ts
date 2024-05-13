import { MigrationInterface, QueryRunner } from "typeorm"

export class RenameMLEnableFlags1693236627291 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE system_config SET key = CASE
            WHEN key = 'ffmpeg.classificationEnabled' THEN 'ffmpeg.classification.enabled'
            WHEN key = 'ffmpeg.clipEnabled' THEN 'ffmpeg.clip.enabled'
            WHEN key = 'ffmpeg.facialRecognitionEnabled' THEN 'ffmpeg.facialRecognition.enabled'
            ELSE key
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE system_config SET key = CASE
            WHEN key = 'ffmpeg.classification.enabled' THEN 'ffmpeg.classificationEnabled'
            WHEN key = 'ffmpeg.clip.enabled' THEN 'ffmpeg.clipEnabled'
            WHEN key = 'ffmpeg.facialRecognition.enabled' THEN 'ffmpeg.facialRecognitionEnabled'
            ELSE key
            END
        `);
    }
}
