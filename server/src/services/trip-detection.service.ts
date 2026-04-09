import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

export interface Trip {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  locations: TripLocation[];
  assetCount: number;
  userId: string;
}

export interface TripLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  timestamp: Date;
}

@Injectable()
export class TripDetectionService extends BaseService {
  private readonly HOME_RADIUS_KM = 50; // Distance threshold from home to consider "traveling"
  private readonly MIN_TRIP_PHOTOS = 5; // Minimum photos to consider a trip
  private readonly MAX_GAP_HOURS = 48; // Max gap between photos in a trip

  @OnJob({ name: JobName.TripDetection, queue: QueueName.BackgroundTask })
  async handleTripDetection(_job: JobOf<JobName.TripDetection>): Promise<JobStatus> {
    try {
      this.logger.log('Running trip detection analysis...');

      // In full implementation:
      // 1. Query all geotagged assets ordered by date
      // 2. Cluster photos by location + time proximity
      // 3. Filter clusters that are far from "home" location
      // 4. Create or update trip records
      // 5. Auto-create albums for detected trips

      // const assets = await this.assetRepository.getAll({
      //   where: { exifInfo: { latitude: Not(IsNull()) } },
      //   order: { fileCreatedAt: 'ASC' },
      // });

      // const clusters = this.clusterByLocationAndTime(assets);
      // const trips = clusters.filter(c => c.length >= this.MIN_TRIP_PHOTOS && this.isAwayFromHome(c));

      // for (const trip of trips) {
      //   await this.createOrUpdateTrip(trip);
      // }

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Trip detection failed: ${error}`);
      return JobStatus.Failed;
    }
  }

  /**
   * Get all detected trips for a user
   */
  async getTrips(userId: string): Promise<Trip[]> {
    // In full implementation: query trip records from database
    this.logger.verbose(`Getting trips for user ${userId}`);
    return [];
  }

  /**
   * Get trip details with assets
   */
  async getTripById(tripId: string): Promise<Trip | null> {
    this.logger.verbose(`Getting trip ${tripId}`);
    return null;
  }

  /**
   * Check if a set of coordinates is "away from home"
   */
  private isAwayFromHome(lat: number, lng: number, homeLat: number, homeLng: number): boolean {
    const distance = this.haversineDistanceKm(lat, lng, homeLat, homeLng);
    return distance > this.HOME_RADIUS_KM;
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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
