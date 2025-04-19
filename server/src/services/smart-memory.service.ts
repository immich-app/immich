import { Injectable } from '@nestjs/common';
import { OnEvent, OnJob } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { JobName, JobStatus, QueueName } from '../enum';
import { ImmichWorker } from '../constants/worker.constant';
import { MemoryType } from '../entities/memory.entity';
import { BaseService } from './base.service';
import { isSmartSearchEnabled } from '../utils/machine-learning.util';
import { ArgOf } from '../repositories/event.repository';
import { handlePromiseError } from '../utils/error.util';
import { SystemMetadataKey } from '../entities/system-metadata.entity';
import { CronExpression } from '@nestjs/schedule';

// Extend the MemoryType enum with new types (if not already in the existing code)
// This would normally be in a separate file and imported
export enum ExtendedMemoryType {
  PERSON_COLLECTION = 'person_collection',
  PEOPLE_GROUP = 'people_group',
  LOCATION_COLLECTION = 'location_collection',
  THEME_COLLECTION = 'theme_collection',
  DISCOVERED_THEME = 'discovered_theme',
  EVENT = 'event',
  SEASONAL = 'seasonal'
}

// Structure for location-based memory
interface LocationMemoryData {
  city?: string;
  state?: string;
  country?: string;
  locationName?: string;
}

// Structure for person-based memory
interface PersonMemoryData {
  personId: string;
  personName: string;
  relatedPeople?: Array<{ id: string; name: string }>;
}

// Structure for theme-based memory
interface ThemeMemoryData {
  theme: string;
  confidence?: number;
  discoveredPrompt?: string;
}

@Injectable()
export class SmartMemoryService extends BaseService {
  
  /**
   * Initialize smart memories on system startup
   */
  @OnEvent({ name: 'app.bootstrap' })
  async onAppBootstrap() {
    this.logger.log('Initializing Smart Memory Service');
  }

  /**
   * Set up recurring jobs based on system configuration
   */
  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  async onConfigInit({ newConfig }: ArgOf<'config.init'>) {
    // This retrieves data from SystemConfig to make this configurable for admins in Web App
    const { smartMemories } = newConfig;
    
    if (smartMemories?.enabled) {
      // Create a daily cron job for smart memory generation
      this.cronRepository.create({
        name: 'smart-memories-generation',
        // This is expression that the admin provides in the admin settings for when smart memories are generated
        expression: smartMemories.cronExpression || CronExpression.EVERY_DAY_AT_MIDNIGHT,
        onTick: () => handlePromiseError(
          this.jobRepository.queue({ name: JobName.SMART_MEMORIES_CREATE }),
          this.logger
        ),
        start: true,
      });
    } else {
      this.logger.log('Smart Memory generation is disabled in configuration');
    }
    
    // Check for existing smart memory state
    const state = await this.systemMetadataRepository.get(SystemMetadataKey.SMART_MEMORIES_STATE);
    if (!state) {
      // Initialize state on first run
      await this.systemMetadataRepository.set(SystemMetadataKey.SMART_MEMORIES_STATE, {
        lastGeneratedAt: null,
        generationCount: 0,
        stats: {
          personCollections: 0,
          peopleGroups: 0,
          locationCollections: 0,
          themeCollections: 0,
          discoveredThemes: 0,
          events: 0,
          seasonal: 0
        }
      });
    }
  }

  /**
   * Handle configuration updates
   */
  @OnEvent({ name: 'config.update', server: true })
  async onConfigUpdate({ newConfig }: ArgOf<'config.update'>) {
    await this.onConfigInit({ newConfig });
  }
  
  /**
   * Main job handler for smart memory creation
   */
  @OnJob({ name: JobName.SMART_MEMORIES_CREATE, queue: QueueName.BACKGROUND_TASK })
  async handleCreateSmartMemories(): Promise<JobStatus> {
    this.logger.log('Starting Smart Memory generation');
    
    const stats = {
      personCollections: 0,
      peopleGroups: 0,
      locationCollections: 0,
      themeCollections: 0,
      discoveredThemes: 0,
      events: 0,
      seasonal: 0
    };
    
    try {
      // Get all active users
      const users = await this.userRepository.getList({ withDeleted: false });
      this.logger.log(`Generating smart memories for ${users.length} users`);
      
      // Process each user sequentially to avoid overloading the system
      for (const user of users) {
        const userStats = await this.generateMemoriesForUser(user.id);
        
        // Accumulate stats
        for (const key in userStats) {
          if (Object.prototype.hasOwnProperty.call(stats, key)) {
            stats[key] += userStats[key];
          }
        }
      }
      
      // Update system metadata with generation stats
      const state = await this.systemMetadataRepository.get(SystemMetadataKey.SMART_MEMORIES_STATE) || {};
      await this.systemMetadataRepository.set(SystemMetadataKey.SMART_MEMORIES_STATE, {
        ...state,
        lastGeneratedAt: new Date().toISOString(),
        generationCount: (state.generationCount || 0) + 1,
        stats
      });
      
      this.logger.log(`Smart Memory generation completed: created ${Object.values(stats).reduce((a, b) => a + b, 0)} memories`);
      return JobStatus.SUCCESS;
    } catch (error) {
      this.logger.error(`Error during Smart Memory generation: ${error}`, error?.stack);
      return JobStatus.FAILED;
    }
  }
  
  /**
   * Generate all types of memories for a single user
   */
  private async generateMemoriesForUser(userId: string) {
    const stats = {
      personCollections: 0,
      peopleGroups: 0,
      locationCollections: 0,
      themeCollections: 0,
      discoveredThemes: 0,
      events: 0,
      seasonal: 0
    };
    
    try {
      // Get configuration settings from system settings that the admin can modify
      const { smartMemories, machineLearning } = await this.getConfig({ withCache: true });
      
      // Generate person-based collections if enabled
      if (smartMemories.enablePersonCollections !== false) {
        const personResults = await this.generatePersonCollections(userId);
        stats.personCollections += personResults.personCollections;
        stats.peopleGroups += personResults.peopleGroups;
      }
      
      // Generate location-based collections if enabled
      if (smartMemories.enableLocationCollections !== false) {
        stats.locationCollections += await this.generateLocationCollections(userId);
      }
      
      // Generate theme-based collections if enabled and ML is available
      if (smartMemories.enableThematicCollections !== false && isSmartSearchEnabled(machineLearning)) {
        const themeResults = await this.generateThematicCollections(userId, machineLearning);
        stats.themeCollections += themeResults.themeCollections;
        stats.discoveredThemes += themeResults.discoveredThemes;
      }
      
      return stats;
    } catch (error) {
      this.logger.error(`Error generating memories for user ${userId}: ${error}`, error?.stack);
      return stats;
    }
  }
  
  /**
   * Creates collections based on people who frequently appear together
   */
  private async generatePersonCollections(userId: string): Promise<{ personCollections: number; peopleGroups: number }> {
    let personCollections = 0;
    let peopleGroups = 0;
    
    try {
      // Get significant people for this user with minimum face count which are then displayed for the users
      const { items: people } = await this.personRepository.getAllForUser(
        { take: 20, skip: 0 }, 
        userId, 
        { minimumFaceCount: 10, withHidden: false }
      );
      
      for (const person of people) {
        if (!person.name) continue;
        
        // Get assets where this person appears
        const assets = await this.assetRepository.getByPersonId(userId, person.id, { limit: 30 });
        if (assets.length < 10) continue;
        
        // Create individual person collection
        await this.memoryRepository.create({
          ownerId: userId,
          type: ExtendedMemoryType.PERSON_COLLECTION,
          data: { 
            personId: person.id, 
            personName: person.name 
          } as PersonMemoryData,
          memoryAt: new Date().toISOString(),
          showAt: DateTime.utc().startOf('day').toISO(),
          hideAt: DateTime.utc().plus({ days: 7 }).endOf('day').toISO(),
        }, new Set(assets.map(asset => asset.id)));
        
        personCollections++;
        
        // Find co-occurring people in the same photos
        const coOccurrences = await this.findCoOccurringPeople(userId, person.id);
        
        if (coOccurrences.length >= 2) {
          // Get assets containing both the primary person and co-occurring people
          const groupAssets = await this.assetRepository.getByMultiplePersonIds(
            userId, 
            [person.id, ...coOccurrences.map(p => p.id)],
            { minPersonCount: 2, limit: 20 }
          );
          
          if (groupAssets.length >= 5) {
            // Create group memory with these people
            await this.memoryRepository.create({
              ownerId: userId,
              type: ExtendedMemoryType.PEOPLE_GROUP,
              data: { 
                personId: person.id,
                personName: person.name,
                relatedPeople: coOccurrences.map(p => ({ id: p.id, name: p.name }))
              } as PersonMemoryData,
              memoryAt: new Date().toISOString(),
              showAt: DateTime.utc().startOf('day').toISO(),
              hideAt: DateTime.utc().plus({ days: 7 }).endOf('day').toISO(),
            }, new Set(groupAssets.map(asset => asset.id)));
            
            peopleGroups++;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error generating person collections: ${error}`, error?.stack);
    }
    
    return { personCollections, peopleGroups };
  }
  
  /**
   * Helper method to find people who frequently appear with a specific person
   */
  private async findCoOccurringPeople(userId: string, personId: string): Promise<Array<{ id: string; name: string }>> {
    // This would ideally be implemented in the person repository
    // For now, we'll simulate the implementation with this function
    
    try {
      // Get assets where the specified person appears
      const assets = await this.assetRepository.getByPersonId(userId, personId, { limit: 100 });
      
      // Find other people who appear in these assets
      const personCounts = new Map<string, { count: number; name: string }>();
      
      for (const asset of assets) {
        // In a real implementation, you would have a way to get all persons in an asset
        // For now, assuming we can get this from the asset.faces property
        if (asset.faces && Array.isArray(asset.faces)) {
          for (const face of asset.faces) {
            if (face.personId && face.personId !== personId) {
              const person = face.person || { id: face.personId, name: '' };
              
              if (person.name) {
                const current = personCounts.get(person.id) || { count: 0, name: person.name };
                current.count += 1;
                personCounts.set(person.id, current);
              }
            }
          }
        }
      }
      
      // Filter to get people who appear in at least 5 photos with the specified person
      return Array.from(personCounts.entries())
        .filter(([_, data]) => data.count >= 5)
        .map(([id, data]) => ({ id, name: data.name }))
        .slice(0, 5); // Limit to top 5 co-occurring people
    } catch (error) {
      this.logger.error(`Error finding co-occurring people: ${error}`, error?.stack);
      return [];
    }
  }
  
  /**
   * Creates collections based on significant locations
   */
  private async generateLocationCollections(userId: string): Promise<number> {
    let locationCollections = 0;
    
    try {
      // Find locations with significant number of photos
      const locations = await this.getSignificantLocations(userId);
      
      for (const location of locations) {
        if (location.assetCount < 15) continue;
        
        // Get assets for this location
        const assets = await this.assetRepository.getByPlace(userId, { 
          city: location.city, 
          state: location.state,
          country: location.country
        });
        
        // Generate a location name
        const locationName = this.formatLocationName(location);
        
        // Create a memory for this trip/location
        await this.memoryRepository.create({
          ownerId: userId,
          type: ExtendedMemoryType.LOCATION_COLLECTION,
          data: { 
            city: location.city, 
            state: location.state,
            country: location.country,
            locationName
          } as LocationMemoryData,
          memoryAt: new Date().toISOString(),
          showAt: DateTime.utc().startOf('day').toISO(),
          hideAt: DateTime.utc().plus({ days: 7 }).endOf('day').toISO(),
        }, new Set(assets.map(asset => asset.id)));
        
        locationCollections++;
      }
    } catch (error) {
      this.logger.error(`Error generating location collections: ${error}`, error?.stack);
    }
    
    return locationCollections;
  }
  
  /**
   * Helper method to find significant locations in a user's library
   */
  private async getSignificantLocations(userId: string) {
    // This would ideally be implemented in the search repository
    // For now, we'll simulate the implementation with this function
    
    try {
      // Query for places with count of assets
      const locations = await this.searchRepository.searchPlaces('');
      
      // Filter for places that have a city, state, or country
      return locations
        .filter(location => {
          return (location.city || location.state || location.country) && location.assetCount >= 15;
        })
        .slice(0, 10); // Limit to top 10 locations
    } catch (error) {
      this.logger.error(`Error getting significant locations: ${error}`, error?.stack);
      return [];
    }
  }
  
  /**
   * Format location data into a readable name
   */
  private formatLocationName(location: { city?: string; state?: string; country?: string }): string {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state && location.state !== location.city) parts.push(location.state);
    if (location.country && parts.length === 0) parts.push(location.country);
    
    return parts.join(', ');
  }
  
  /**
   * Creates thematic collections using CLIP embeddings and clustering
   */
  private async generateThematicCollections(userId: string, machineLearning: any): 
      Promise<{ themeCollections: number; discoveredThemes: number }> {
    let themeCollections = 0;
    let discoveredThemes = 0;
    
    try {
      // 1. Predefined themes with prompts
      const themes = [
        { name: "Nature", prompt: "beautiful nature, landscapes, outdoors, forests, mountains, lakes" },
        { name: "Food", prompt: "delicious food, meals, cooking, restaurants, dining" },
        { name: "Architecture", prompt: "buildings, architecture, structures, monuments, cityscape" },
        { name: "Pets", prompt: "cute pets, dogs, cats, animals, furry friends" },
        { name: "Travel", prompt: "travel, vacations, journeys, tourism, sightseeing" }
      ];
      
      for (const theme of themes) {
        // Generate embedding for theme prompt
        const embedding = await this.machineLearningRepository.encodeText(
          machineLearning.urls,
          theme.prompt,
          machineLearning.clip
        );
        
        // Search for matching assets
        const matches = await this.searchRepository.searchSmart(
          { page: 1, size: 30 },
          { userIds: [userId], embedding, minScore: 0.25 }
        );
        
        if (matches.items.length >= 15) {
          // Create thematic memory
          await this.memoryRepository.create({
            ownerId: userId,
            type: ExtendedMemoryType.THEME_COLLECTION,
            data: { 
              theme: theme.name,
              confidence: 0.8 // Predefined themes have high confidence
            } as ThemeMemoryData,
            memoryAt: new Date().toISOString(),
            showAt: DateTime.utc().startOf('day').toISO(),
            hideAt: DateTime.utc().plus({ days: 7 }).endOf('day').toISO(),
          }, new Set(matches.items.map(asset => asset.id)));
          
          themeCollections++;
        }
      }
      
      // 2. Discovered themes using facet clustering
      const facets = await this.getDiscoveredFacets(userId);
      
      for (const facet of facets) {
        // Get relevant assets for this auto-discovered theme
        const assets = await this.getFacetAssets(userId, facet);
        
        if (assets.length >= 10) {
          // Create dynamic thematic memory
          await this.memoryRepository.create({
            ownerId: userId,
            type: ExtendedMemoryType.DISCOVERED_THEME,
            data: { 
              theme: facet.name,
              confidence: facet.confidence,
              discoveredPrompt: facet.prompt
            } as ThemeMemoryData,
            memoryAt: new Date().toISOString(),
            showAt: DateTime.utc().startOf('day').toISO(),
            hideAt: DateTime.utc().plus({ days: 7 }).endOf('day').toISO(),
          }, new Set(assets.map(asset => asset.id)));
          
          discoveredThemes++;
        }
      }
    } catch (error) {
      this.logger.error(`Error generating thematic collections: ${error}`, error?.stack);
    }
    
    return { themeCollections, discoveredThemes };
  }
  
  /**
   * Discover facets/clusters in a user's library
   */
  private async getDiscoveredFacets(userId: string): Promise<Array<{ id: string; name: string; confidence: number; prompt: string }>> {
    // This would ideally be implemented in the search repository
    // For now, we'll simulate the implementation with this function
    
    try {
      const discoveredThemes = [
        { id: '1', name: 'Beach Days', confidence: 0.75, prompt: 'beach, ocean, sand, waves, seaside' },
        { id: '2', name: 'City Life', confidence: 0.7, prompt: 'urban, city, streets, downtown, buildings' },
        { id: '3', name: 'Sunset Moments', confidence: 0.8, prompt: 'sunset, golden hour, dusk, evening sky' }
      ];
      
      return discoveredThemes;
    } catch (error) {
      this.logger.error(`Error discovering facets: ${error}`, error?.stack);
      return [];
    }
  }
  
  /**
   * Get assets for a discovered facet/cluster
   */
  private async getFacetAssets(userId: string, facet: { id: string; prompt: string }) {
    try {
      // In a real implementation, you might have a more efficient way to get these assets
      // For now, we'll use smart search with the facet prompt
      const { machineLearning } = await this.getConfig({ withCache: true });
      
      const embedding = await this.machineLearningRepository.encodeText(
        machineLearning.urls,
        facet.prompt,
        machineLearning.clip
      );
      
      const matches = await this.searchRepository.searchSmart(
        { page: 1, size: 20 },
        { userIds: [userId], embedding, minScore: 0.3 }
      );
      
      return matches.items;
    } catch (error) {
      this.logger.error(`Error getting facet assets: ${error}`, error?.stack);
      return [];
    }
  }
}