import { Test, TestingModule } from '@nestjs/testing';
import { SmartMemoryService, ExtendedMemoryType } from './smart-memory.service';
import { JobName, JobStatus, QueueName } from '../enum';
import { ImmichWorker } from '../enum/worker.enum';
import { SystemMetadataKey } from '../entities/system-metadata.entity';
import { DateTime } from 'luxon';
import { SystemConfig } from 'src/config';

describe('SmartMemoryService', () => {
  let service: SmartMemoryService;
  let mockUserRepository;
  let mockMemoryRepository;
  let mockAssetRepository;
  let mockPersonRepository;
  let mockSearchRepository;
  let mockSystemMetadataRepository;
  let mockCronRepository;
  let mockJobRepository;
  let mockMachineLearningRepository;
  let mockLogger;
  let mockEventRepository;

  const mockUser = { id: 'user1', email: 'test@example.com' };
  const mockPerson = { id: 'person1', name: 'John Doe', faceAssetId: 'face1' };
  const mockAsset = { id: 'asset1', originalPath: '/path/to/asset.jpg' };
  const mockMemory = { id: 'memory1', type: ExtendedMemoryType.PERSON_COLLECTION };
  const mockConfig = {
    smartMemories: {
      enabled: true,
      cronExpression: '0 0 * * *',
      enablePersonCollections: true,
      enableLocationCollections: true,
      enableThematicCollections: true,
    },
    machineLearning: {
      enabled: true,
      clip: {
        modelName: 'ViT-B/32'
      }
    }
  };

  beforeEach(async () => {
    // Create mock repositories
    mockUserRepository = {
      getList: jest.fn().mockResolvedValue([mockUser])
    };
    
    mockMemoryRepository = {
      create: jest.fn().mockResolvedValue(mockMemory)
    };
    
    mockAssetRepository = {
      getByPersonId: jest.fn().mockResolvedValue([mockAsset, mockAsset]),
      getByPlace: jest.fn().mockResolvedValue([mockAsset, mockAsset]),
      getByMultiplePersonIds: jest.fn().mockResolvedValue([mockAsset, mockAsset])
    };
    
    mockPersonRepository = {
      getAllForUser: jest.fn().mockResolvedValue({ items: [mockPerson], hasNextPage: false })
    };
    
    mockSearchRepository = {
      searchPlaces: jest.fn().mockResolvedValue([
        { city: 'New York', state: 'NY', country: 'USA', assetCount: 20 }
      ]),
      searchSmart: jest.fn().mockResolvedValue({ items: [mockAsset, mockAsset], hasNextPage: true })
    };
    
    mockSystemMetadataRepository = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true)
    };
    
    mockCronRepository = {
      create: jest.fn().mockReturnValue(true)
    };
    
    mockJobRepository = {
      queue: jest.fn().mockResolvedValue(true)
    };
    
    mockMachineLearningRepository = {
      encodeText: jest.fn().mockResolvedValue(new Float32Array(512))
    };
    
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn()
    };
    
    mockEventRepository = {
      emit: jest.fn().mockResolvedValue(true)
    };

    // Create the service with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartMemoryService,
        { provide: 'UserRepository', useValue: mockUserRepository },
        { provide: 'MemoryRepository', useValue: mockMemoryRepository },
        { provide: 'AssetRepository', useValue: mockAssetRepository },
        { provide: 'PersonRepository', useValue: mockPersonRepository },
        { provide: 'SearchRepository', useValue: mockSearchRepository },
        { provide: 'SystemMetadataRepository', useValue: mockSystemMetadataRepository },
        { provide: 'CronRepository', useValue: mockCronRepository },
        { provide: 'JobRepository', useValue: mockJobRepository },
        { provide: 'MachineLearningRepository', useValue: mockMachineLearningRepository },
        { provide: 'EventRepository', useValue: mockEventRepository },
        { provide: 'LoggerService', useValue: mockLogger }
      ],
    }).compile();

    service = module.get<SmartMemoryService>(SmartMemoryService);
    
    // Mock the getConfig method to return the known config
    service.getConfig = jest.fn().mockResolvedValue(mockConfig);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onConfigInit', () => {
    it('should create cron job when smartMemories is enabled', async () => {
      await service.onConfigInit({ newConfig: mockConfig });

      // Verify the cron job was created with the correct parameters
      expect(mockCronRepository.create).toHaveBeenCalledWith({
        name: 'smart-memories-generation',
        expression: mockConfig.smartMemories.cronExpression,
        onTick: expect.any(Function), // Check that it's a function, but don't execute
        start: true,
      });

      // Verify that the system metadata is initialized
      expect(mockSystemMetadataRepository.set).toHaveBeenCalledWith(
        SystemMetadataKey.SMART_MEMORIES_STATE,
        expect.objectContaining({
          lastGeneratedAt: null,
          generationCount: 0,
          stats: expect.any(Object)
        })
      );
    });
    
    it('should not create cron job when smartMemories is disabled', async () => {
      await service.onConfigInit({ 
        newConfig: { ...mockConfig, smartMemories: { ...mockConfig.smartMemories, enabled: false } } 
      });
      
      expect(mockCronRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('handleCreateSmartMemories', () => {
    it('should process all users and update stats', async () => {
      // Mock the internal functions to control their behavior during the test
      service['generateMemoriesForUser'] = jest.fn().mockResolvedValue({
        personCollections: 2,
        peopleGroups: 1,
        locationCollections: 3,
        themeCollections: 2,
        discoveredThemes: 1
      });
      
      const result = await service.handleCreateSmartMemories();
      
      expect(result).toBe(JobStatus.SUCCESS);
      expect(mockUserRepository.getList).toHaveBeenCalledWith({ withDeleted: false });
      expect(service['generateMemoriesForUser']).toHaveBeenCalledWith(mockUser.id);
      expect(mockSystemMetadataRepository.set).toHaveBeenCalledWith(
        SystemMetadataKey.SMART_MEMORIES_STATE,
        expect.objectContaining({
          lastGeneratedAt: expect.any(String),
          generationCount: 1,
          stats: expect.objectContaining({
            personCollections: 2,
            peopleGroups: 1,
            locationCollections: 3,
            themeCollections: 2,
            discoveredThemes: 1
          })
        })
      );
    });
    
    it('should return failed status when error occurs', async () => {
      // Force an error by rejecting the getList mock
      mockUserRepository.getList.mockRejectedValue(new Error('Test error'));
      
      const result = await service.handleCreateSmartMemories();
      
      expect(result).toBe(JobStatus.FAILED);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('generatePersonCollections', () => {
    beforeEach(() => {
      // Mock internal methods
      service['findCoOccurringPeople'] = jest.fn().mockResolvedValue([
        { id: 'person2', name: 'Jane Doe' },
        { id: 'person3', name: 'Bob Smith' }
      ]);
    });
    
    it('should create person collections and group collections', async () => {
      const result = await service['generatePersonCollections'](mockUser.id);
      
      expect(result).toEqual({
        personCollections: 1,
        peopleGroups: 1
      });
      
      expect(mockPersonRepository.getAllForUser).toHaveBeenCalledWith(
        expect.any(Object),
        mockUser.id,
        expect.objectContaining({ minimumFaceCount: 10, withHidden: false })
      );
      
      expect(mockAssetRepository.getByPersonId).toHaveBeenCalledWith(
        mockUser.id,
        mockPerson.id,
        expect.any(Object)
      );
      
      expect(mockMemoryRepository.create).toHaveBeenCalledTimes(2);
      expect(mockMemoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
          type: ExtendedMemoryType.PERSON_COLLECTION,
          data: expect.objectContaining({
            personId: mockPerson.id,
            personName: mockPerson.name
          })
        }),
        expect.any(Set)
      );
    });
  });

  describe('generateLocationCollections', () => {
    beforeEach(() => {
      // Mock internal methods
      service['getSignificantLocations'] = jest.fn().mockResolvedValue([
        { city: 'New York', state: 'NY', country: 'USA', assetCount: 20 }
      ]);
      
      service['formatLocationName'] = jest.fn().mockReturnValue('New York, NY');
    });
    
    it('should create location collections', async () => {
      const result = await service['generateLocationCollections'](mockUser.id);
      
      expect(result).toBe(1);
      
      expect(service['getSignificantLocations']).toHaveBeenCalledWith(mockUser.id);
      
      expect(mockAssetRepository.getByPlace).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          city: 'New York',
          state: 'NY',
          country: 'USA'
        })
      );
      
      expect(mockMemoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
          type: ExtendedMemoryType.LOCATION_COLLECTION,
          data: expect.objectContaining({
            city: 'New York',
            state: 'NY',
            country: 'USA',
            locationName: 'New York, NY'
          })
        }),
        expect.any(Set)
      );
    });
  });

  describe('generateThematicCollections', () => {
    beforeEach(() => {
      // Mock internal methods
      service['getDiscoveredFacets'] = jest.fn().mockResolvedValue([
        { id: 'facet1', name: 'Beach Days', confidence: 0.75, prompt: 'beach, ocean' }
      ]);
      
      service['getFacetAssets'] = jest.fn().mockResolvedValue([mockAsset, mockAsset]);
    });
    
    it('should create theme collections and discovered themes', async () => {
      const result = await service['generateThematicCollections'](mockUser.id, mockConfig.machineLearning);
      
      expect(result).toEqual({
        themeCollections: 5, // One for each predefined theme
        discoveredThemes: 1
      });
      
      // Check that CLIP encodings were created
      expect(mockMachineLearningRepository.encodeText).toHaveBeenCalledTimes(5);
      
      // Check that smart search was performed
      expect(mockSearchRepository.searchSmart).toHaveBeenCalledTimes(5);
      
      // Check that memories were created
      expect(mockMemoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
          type: ExtendedMemoryType.THEME_COLLECTION,
          data: expect.objectContaining({
            theme: expect.any(String)
          })
        }),
        expect.any(Set)
      );
      
      // Check discovered themes
      expect(service['getDiscoveredFacets']).toHaveBeenCalledWith(mockUser.id);
      expect(service['getFacetAssets']).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      
      expect(mockMemoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: mockUser.id,
          type: ExtendedMemoryType.DISCOVERED_THEME,
          data: expect.objectContaining({
            theme: 'Beach Days',
            confidence: 0.75
          })
        }),
        expect.any(Set)
      );
    });
  });
});