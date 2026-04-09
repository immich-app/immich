import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';

export interface PrivacyZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  action: PrivacyAction;
  userId: string;
  createdAt: Date;
}

export type PrivacyAction = 'strip_gps' | 'blur_location' | 'offset_random' | 'block_share';

export interface PrivacyConfig {
  zones: PrivacyZone[];
  defaultShareStripping: boolean;
  stripGpsOnExport: boolean;
  blurFacesOnShare: boolean;
}

@Injectable()
export class LocationPrivacyService extends BaseService {
  /**
   * Check if an asset falls within any privacy zone
   * Called during sharing, export, and link generation
   */
  async checkPrivacyZones(
    assetId: string,
    userId: string,
  ): Promise<{ inZone: boolean; action: PrivacyAction | null; zone: PrivacyZone | null }> {
    try {
      const exif = await this.assetRepository.getExifById(assetId);
      if (!exif?.latitude || !exif?.longitude) {
        return { inZone: false, action: null, zone: null };
      }

      // In full implementation: query privacy zones from DB
      // const zones = await this.privacyZoneRepository.getByUserId(userId);
      const zones: PrivacyZone[] = [];

      for (const zone of zones) {
        const distance = this.haversineDistance(
          exif.latitude,
          exif.longitude,
          zone.latitude,
          zone.longitude,
        );

        if (distance <= zone.radiusMeters) {
          return { inZone: true, action: zone.action, zone };
        }
      }

      return { inZone: false, action: null, zone: null };
    } catch (error: unknown) {
      this.logger.error(`Privacy zone check failed for asset ${assetId}: ${error}`);
      return { inZone: false, action: null, zone: null };
    }
  }

  /**
   * Apply privacy action to asset metadata before sharing
   */
  async applyPrivacy(
    assetId: string,
    action: PrivacyAction,
  ): Promise<Record<string, unknown>> {
    const exif = await this.assetRepository.getExifById(assetId);
    if (!exif) {
      return {};
    }

    switch (action) {
      case 'strip_gps':
        return { latitude: null, longitude: null, city: null, state: null, country: null };

      case 'blur_location':
        // Round coordinates to ~1km precision
        return {
          latitude: exif.latitude ? Math.round(exif.latitude * 100) / 100 : null,
          longitude: exif.longitude ? Math.round(exif.longitude * 100) / 100 : null,
        };

      case 'offset_random': {
        // Randomly offset by up to 500m
        const offsetLat = (Math.random() - 0.5) * 0.009; // ~500m
        const offsetLng = (Math.random() - 0.5) * 0.009;
        return {
          latitude: exif.latitude ? exif.latitude + offsetLat : null,
          longitude: exif.longitude ? exif.longitude + offsetLng : null,
        };
      }

      case 'block_share':
        // Signal to caller that sharing should be blocked
        return { blocked: true, reason: 'Asset is in a privacy zone' };

      default:
        return {};
    }
  }

  /**
   * Haversine formula for distance between two GPS coordinates
   * Returns distance in meters
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
