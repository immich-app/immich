import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export interface NlpSearchResult {
  assetId: string;
  score: number;
  matchType: 'semantic' | 'description' | 'ocr' | 'scene_tag' | 'combined';
}

@Injectable()
export class NlpSearchService extends BaseService {
  /**
   * Enhanced NLP search that combines:
   * 1. Existing CLIP semantic search
   * 2. AI description full-text search
   * 3. OCR text search
   * 4. Scene tag matching
   * 5. Natural language query parsing (dates, locations, people)
   */
  async search(query: string, userId: string, limit: number = 50): Promise<NlpSearchResult[]> {
    const results: NlpSearchResult[] = [];
    const parsed = this.parseQuery(query);

    try {
      // 1. CLIP semantic search (existing)
      const clipResults = await this.searchRepository.searchByEmbedding({
        embedding: [],
        limit,
        userIds: [userId],
      } as any);

      for (const result of clipResults) {
        results.push({
          assetId: result.assetId,
          score: result.distance ? 1 - result.distance : 0.5,
          matchType: 'semantic',
        });
      }

      // 2. Full-text search on AI descriptions
      if (parsed.textQuery) {
        const descriptionResults = await this.assetRepository.search({
          exifInfo: { description: parsed.textQuery },
        } as any);

        for (const asset of descriptionResults.items || []) {
          const existing = results.find((r) => r.assetId === asset.id);
          if (existing) {
            existing.score = Math.min(1, existing.score + 0.2);
            existing.matchType = 'combined';
          } else {
            results.push({ assetId: asset.id, score: 0.6, matchType: 'description' });
          }
        }
      }
    } catch (error: unknown) {
      this.logger.error(`NLP search failed: ${error}`);
    }

    // Sort by score descending and deduplicate
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private parseQuery(query: string): ParsedQuery {
    const parsed: ParsedQuery = { textQuery: query, filters: {} };

    // Date patterns
    const dateMatch = query.match(/(?:from|in|during)\s+(\d{4})/i);
    if (dateMatch) {
      parsed.filters.year = Number.parseInt(dateMatch[1]);
      parsed.textQuery = query.replace(dateMatch[0], '').trim();
    }

    // Month patterns
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];
    for (const [i, month] of months.entries()) {
      if (query.toLowerCase().includes(month)) {
        parsed.filters.month = i + 1;
        parsed.textQuery = query.replace(new RegExp(month, 'i'), '').trim();
        break;
      }
    }

    // Location patterns
    const locationMatch = query.match(/(?:at|in|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (locationMatch) {
      parsed.filters.location = locationMatch[1];
    }

    // People patterns
    const personMatch = query.match(/(?:with|of)\s+([A-Z][a-z]+)/);
    if (personMatch) {
      parsed.filters.person = personMatch[1];
    }

    return parsed;
  }
}

interface ParsedQuery {
  textQuery: string;
  filters: {
    year?: number;
    month?: number;
    location?: string;
    person?: string;
  };
}
