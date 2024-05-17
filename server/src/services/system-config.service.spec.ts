import { BadRequestException } from '@nestjs/common';
import {
  AudioCodec,
  CQMode,
  Colorspace,
  ImageFormat,
  LogLevel,
  SystemConfig,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
  defaults,
} from 'src/config';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { IEventRepository, ServerEvent } from 'src/interfaces/event.interface';
import { QueueName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SystemConfigService } from 'src/services/system-config.service';
import { newEventRepositoryMock } from 'test/repositories/event.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { DeepPartial } from 'typeorm';
import { Mocked } from 'vitest';

const partialConfig = {
  ffmpeg: { crf: 30 },
  oauth: { autoLaunch: true },
  trash: { days: 10 },
  user: { deleteDelay: 15 },
} satisfies DeepPartial<SystemConfig>;

const updatedConfig = Object.freeze<SystemConfig>({
  job: {
    [QueueName.BACKGROUND_TASK]: { concurrency: 5 },
    [QueueName.SMART_SEARCH]: { concurrency: 2 },
    [QueueName.METADATA_EXTRACTION]: { concurrency: 5 },
    [QueueName.FACE_DETECTION]: { concurrency: 2 },
    [QueueName.SEARCH]: { concurrency: 5 },
    [QueueName.SIDECAR]: { concurrency: 5 },
    [QueueName.LIBRARY]: { concurrency: 5 },
    [QueueName.MIGRATION]: { concurrency: 5 },
    [QueueName.THUMBNAIL_GENERATION]: { concurrency: 5 },
    [QueueName.VIDEO_CONVERSION]: { concurrency: 1 },
    [QueueName.NOTIFICATION]: { concurrency: 5 },
  },
  ffmpeg: {
    crf: 30,
    threads: 0,
    preset: 'ultrafast',
    targetAudioCodec: AudioCodec.AAC,
    acceptedAudioCodecs: [AudioCodec.AAC, AudioCodec.MP3, AudioCodec.LIBOPUS],
    targetResolution: '720',
    targetVideoCodec: VideoCodec.H264,
    acceptedVideoCodecs: [VideoCodec.H264],
    maxBitrate: '0',
    bframes: -1,
    refs: 0,
    gopSize: 0,
    npl: 0,
    temporalAQ: false,
    cqMode: CQMode.AUTO,
    twoPass: false,
    preferredHwDevice: 'auto',
    transcode: TranscodePolicy.REQUIRED,
    accel: TranscodeHWAccel.DISABLED,
    accelDecode: false,
    tonemap: ToneMapping.HABLE,
  },
  logging: {
    enabled: true,
    level: LogLevel.LOG,
  },
  machineLearning: {
    enabled: true,
    url: 'http://immich-machine-learning:3003',
    clip: {
      enabled: true,
      modelName: 'ViT-B-32__openai',
    },
    duplicateDetection: {
      enabled: false,
      maxDistance: 0.03,
    },
    facialRecognition: {
      enabled: true,
      modelName: 'buffalo_l',
      minScore: 0.7,
      maxDistance: 0.5,
      minFaces: 3,
    },
  },
  map: {
    enabled: true,
    lightStyle: '',
    darkStyle: '',
  },
  reverseGeocoding: {
    enabled: true,
  },
  oauth: {
    autoLaunch: true,
    autoRegister: true,
    buttonText: 'Login with OAuth',
    clientId: '',
    clientSecret: '',
    defaultStorageQuota: 0,
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    storageLabelClaim: 'preferred_username',
    storageQuotaClaim: 'immich_quota',
  },
  passwordLogin: {
    enabled: true,
  },
  server: {
    externalDomain: '',
    loginPageMessage: '',
  },
  storageTemplate: {
    enabled: false,
    hashVerificationEnabled: true,
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },
  image: {
    thumbnailFormat: ImageFormat.WEBP,
    thumbnailSize: 250,
    previewFormat: ImageFormat.JPEG,
    previewSize: 1440,
    quality: 80,
    colorspace: Colorspace.P3,
    extractEmbedded: false,
  },
  newVersionCheck: {
    enabled: true,
  },
  trash: {
    enabled: true,
    days: 10,
  },
  theme: {
    customCss: '',
  },
  library: {
    scan: {
      enabled: true,
      cronExpression: '0 0 * * *',
    },
    watch: {
      enabled: false,
    },
  },
  user: {
    deleteDelay: 15,
  },
  notifications: {
    smtp: {
      enabled: false,
      from: '',
      replyTo: '',
      transport: {
        host: '',
        port: 587,
        username: '',
        password: '',
        ignoreCert: false,
      },
    },
  },
});

describe(SystemConfigService.name, () => {
  let sut: SystemConfigService;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let eventMock: Mocked<IEventRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let smartInfoMock: Mocked<ISearchRepository>;

  beforeEach(() => {
    delete process.env.IMMICH_CONFIG_FILE;
    systemMock = newSystemMetadataRepositoryMock();
    eventMock = newEventRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new SystemConfigService(systemMock, eventMock, loggerMock, smartInfoMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDefaults', () => {
    it('should return the default config', () => {
      systemMock.get.mockResolvedValue(partialConfig);

      expect(sut.getDefaults()).toEqual(defaults);
      expect(systemMock.get).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return the default config', async () => {
      systemMock.get.mockResolvedValue({});

      await expect(sut.getConfig()).resolves.toEqual(defaults);
    });

    it('should merge the overrides', async () => {
      systemMock.get.mockResolvedValue({
        ffmpeg: { crf: 30 },
        oauth: { autoLaunch: true },
        trash: { days: 10 },
        user: { deleteDelay: 15 },
      });

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);
    });

    it('should load the config from a json file', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';

      systemMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should load the config from a yaml file', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.yaml';
      const partialConfig = `
        ffmpeg:
          crf: 30
        oauth:
          autoLaunch: true
        trash:
          days: 10
        user:
          deleteDelay: 15
      `;
      systemMock.readFile.mockResolvedValue(partialConfig);

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.yaml');
    });

    it('should accept an empty configuration file', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      systemMock.readFile.mockResolvedValue(JSON.stringify({}));

      await expect(sut.getConfig()).resolves.toEqual(defaults);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should allow underscores in the machine learning url', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      const partialConfig = { machineLearning: { url: 'immich_machine_learning' } };
      systemMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await sut.getConfig();
      expect(config.machineLearning.url).toEqual('immich_machine_learning');
    });

    it('should warn for unknown options in yaml', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.yaml';
      const partialConfig = `
        unknownOption: true
      `;
      systemMock.readFile.mockResolvedValue(partialConfig);

      await sut.getConfig();
      expect(loggerMock.warn).toHaveBeenCalled();
    });

    const tests = [
      { should: 'validate numbers', config: { ffmpeg: { crf: 'not-a-number' } } },
      { should: 'validate booleans', config: { oauth: { enabled: 'invalid' } } },
      { should: 'validate enums', config: { ffmpeg: { transcode: 'unknown' } } },
      { should: 'validate required oauth fields', config: { oauth: { enabled: true } } },
      { should: 'warn for top level unknown options', warn: true, config: { unknownOption: true } },
      { should: 'warn for nested unknown options', warn: true, config: { ffmpeg: { unknownOption: true } } },
    ];

    for (const test of tests) {
      it(`should ${test.should}`, async () => {
        process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
        systemMock.readFile.mockResolvedValue(JSON.stringify(test.config));

        if (test.warn) {
          await sut.getConfig();
          expect(loggerMock.warn).toHaveBeenCalled();
        } else {
          await expect(sut.getConfig()).rejects.toBeInstanceOf(Error);
        }
      });
    }
  });

  describe('getStorageTemplateOptions', () => {
    it('should send back the datetime variables', () => {
      expect(sut.getStorageTemplateOptions()).toEqual({
        dayOptions: ['d', 'dd'],
        hourOptions: ['h', 'hh', 'H', 'HH'],
        minuteOptions: ['m', 'mm'],
        monthOptions: ['M', 'MM', 'MMM', 'MMMM'],
        presetOptions: [
          '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MMMM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MM}}/{{filename}}',
          '{{y}}/{{MMM}}/{{filename}}',
          '{{y}}/{{MMMM}}/{{filename}}',
          '{{y}}/{{MM}}/{{dd}}/{{filename}}',
          '{{y}}/{{MMMM}}/{{dd}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MMM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MMMM}}-{{dd}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}/{{filename}}',
          '{{y}}/{{y}}-{{WW}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}-{{dd}}/{{assetId}}',
          '{{y}}/{{y}}-{{MM}}/{{assetId}}',
          '{{y}}/{{y}}-{{WW}}/{{assetId}}',
          '{{album}}/{{filename}}',
        ],
        secondOptions: ['s', 'ss', 'SSS'],
        weekOptions: ['W', 'WW'],
        yearOptions: ['y', 'yy'],
      });
    });
  });

  describe('updateConfig', () => {
    it('should update the config and emit client and server events', async () => {
      systemMock.get.mockResolvedValue(partialConfig);

      await expect(sut.updateConfig(updatedConfig)).resolves.toEqual(updatedConfig);

      expect(eventMock.clientBroadcast).toHaveBeenCalled();
      expect(eventMock.serverSend).toHaveBeenCalledWith(ServerEvent.CONFIG_UPDATE, null);
      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.SYSTEM_CONFIG, partialConfig);
    });

    it('should throw an error if a config file is in use', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      systemMock.readFile.mockResolvedValue(JSON.stringify({}));
      await expect(sut.updateConfig(defaults)).rejects.toBeInstanceOf(BadRequestException);
      expect(systemMock.set).not.toHaveBeenCalled();
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });
  });
});
