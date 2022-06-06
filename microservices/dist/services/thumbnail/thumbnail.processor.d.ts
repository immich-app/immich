import { Job } from 'bull';
import { EntityManager } from 'typeorm';
export declare class ThumbnailProcessor {
    private entityManager;
    constructor(entityManager: EntityManager);
    generateThumbnail(job: Job): Promise<void>;
    generateWebpThumbnail(job: Job): Promise<void>;
}
