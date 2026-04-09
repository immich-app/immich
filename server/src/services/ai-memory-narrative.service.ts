import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

@Injectable()
export class AiMemoryNarrativeService extends BaseService {
  @OnJob({ name: JobName.AiMemoryNarrative, queue: QueueName.BackgroundTask })
  async handleMemoryNarrative(_job: JobOf<JobName.AiMemoryNarrative>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    try {
      // Generate narrative summaries for existing memories
      // Memories are date-based ("On this day" style) - enhance with AI descriptions
      const memories = await this.memoryRepository.getAll(undefined as any);

      for (const memory of memories) {
        if (!memory.assets?.length) {
          continue;
        }

        // Collect descriptions from memory's assets
        const descriptions: string[] = [];
        for (const asset of memory.assets.slice(0, 10)) {
          const exif = await this.assetRepository.getExifById(asset.id);
          if (exif?.description) {
            descriptions.push(exif.description);
          }
        }

        if (descriptions.length < 2) {
          continue;
        }

        // Use VLM to generate a narrative from the descriptions
        try {
          const narrative = await this.generateNarrative(descriptions, memory);
          if (narrative) {
            this.logger.verbose(`Generated narrative for memory ${memory.id}: "${narrative.substring(0, 80)}..."`);
          }
        } catch {
          this.logger.warn(`Failed to generate narrative for memory ${memory.id}`);
        }
      }

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate memory narratives: ${error}`);
      return JobStatus.Failed;
    }
  }

  private async generateNarrative(descriptions: string[], memory: any): Promise<string | null> {
    // Build a prompt from the collected descriptions
    const prompt = `These photos are from a memory titled "${memory.data?.title || 'Untitled'}". 
Based on these AI descriptions, write a brief, warm narrative (2-3 sentences) about this memory:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;

    try {
      const result = await this.machineLearningRepository.describeImage('', { prompt } as any);
      return result?.description || null;
    } catch {
      return null;
    }
  }
}
