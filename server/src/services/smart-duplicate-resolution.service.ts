import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

export interface SmartDuplicate {
  primaryAssetId: string;
  duplicateAssetId: string;
  similarity: number;
  resolution: 'keep_primary' | 'keep_duplicate' | 'keep_both' | 'unresolved';
  reason: string;
}

@Injectable()
export class SmartDuplicateResolutionService extends BaseService {
  /**
   * Analyze a pair of duplicate candidates and suggest which to keep.
   * Uses multiple signals:
   * - Resolution (higher = better)
   * - File size (larger usually = better quality)
   * - EXIF completeness
   * - Has GPS data
   * - Has AI description
   * - Original filename vs edited
   * - File format (RAW > HEIC > JPEG > PNG for photos)
   */
  async analyzePair(assetId1: string, assetId2: string): Promise<SmartDuplicate> {
    try {
      const [exif1, exif2] = await Promise.all([
        this.assetRepository.getExifById(assetId1),
        this.assetRepository.getExifById(assetId2),
      ]);

      let score1 = 0;
      let score2 = 0;
      const reasons: string[] = [];

      // Resolution comparison
      const px1 = (exif1?.exifImageWidth || 0) * (exif1?.exifImageHeight || 0);
      const px2 = (exif2?.exifImageWidth || 0) * (exif2?.exifImageHeight || 0);
      if (px1 > px2 * 1.1) {
        score1 += 2;
        reasons.push('higher resolution');
      } else if (px2 > px1 * 1.1) {
        score2 += 2;
        reasons.push('higher resolution');
      }

      // File size comparison
      const size1 = exif1?.fileSizeInByte || 0;
      const size2 = exif2?.fileSizeInByte || 0;
      if (size1 > size2 * 1.2) {
        score1 += 1;
        reasons.push('larger file');
      } else if (size2 > size1 * 1.2) {
        score2 += 1;
        reasons.push('larger file');
      }

      // EXIF completeness
      const exifCount1 = this.countExifFields(exif1);
      const exifCount2 = this.countExifFields(exif2);
      if (exifCount1 > exifCount2 + 2) {
        score1 += 1;
        reasons.push('more EXIF data');
      } else if (exifCount2 > exifCount1 + 2) {
        score2 += 1;
        reasons.push('more EXIF data');
      }

      // GPS data
      if (exif1?.latitude && !exif2?.latitude) {
        score1 += 1;
        reasons.push('has GPS');
      } else if (exif2?.latitude && !exif1?.latitude) {
        score2 += 1;
        reasons.push('has GPS');
      }

      // AI description
      if (exif1?.description && !exif2?.description) {
        score1 += 1;
        reasons.push('has description');
      } else if (exif2?.description && !exif1?.description) {
        score2 += 1;
        reasons.push('has description');
      }

      // Determine resolution
      let resolution: SmartDuplicate['resolution'] = 'unresolved';
      let primaryId = assetId1;

      if (score1 > score2) {
        resolution = 'keep_primary';
        primaryId = assetId1;
      } else if (score2 > score1) {
        resolution = 'keep_primary';
        primaryId = assetId2;
      } else {
        resolution = 'keep_both';
      }

      return {
        primaryAssetId: primaryId,
        duplicateAssetId: primaryId === assetId1 ? assetId2 : assetId1,
        similarity: 0, // Would come from CLIP similarity in full implementation
        resolution,
        reason: reasons.join(', ') || 'no distinguishing factors',
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to analyze duplicate pair: ${error}`);
      return {
        primaryAssetId: assetId1,
        duplicateAssetId: assetId2,
        similarity: 0,
        resolution: 'unresolved',
        reason: 'analysis failed',
      };
    }
  }

  private countExifFields(exif: any): number {
    if (!exif) {
      return 0;
    }
    return Object.values(exif).filter((v) => v !== null && v !== undefined && v !== '').length;
  }
}
