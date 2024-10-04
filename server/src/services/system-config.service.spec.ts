import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import {
  AudioCodec,
  Colorspace,
  CQMode,
  ImageFormat,
  LogLevel,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { IEventRepository } from 'src/interfaces/event.interface';
import { QueueName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SystemConfigService } from 'src/services/system-config.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService } from 'test/utils';
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
    [QueueName.THUMBNAIL_GENERATION]: { concurrency: 3 },
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
    acceptedContainers: [VideoContainer.MOV, VideoContainer.OGG, VideoContainer.WEBM],
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
  metadata: {
    faces: {
      import: false,
    },
  },
  machineLearning: {
    enabled: true,
    url: 'http://immich-machine-learning:3003',
    clip: {
      enabled: true,
      modelName: 'ViT-B-32__openai',
    },
    duplicateDetection: {
      enabled: true,
      maxDistance: 0.01,
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
    lightStyle: 'https://tiles.immich.cloud/v1/style/light.json',
    darkStyle: 'https://tiles.immich.cloud/v1/style/dark.json',
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
    profileSigningAlgorithm: 'none',
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
    thumbnail: {
      size: 250,
      format: ImageFormat.WEBP,
      quality: 80,
    },
    preview: {
      size: 1440,
      format: ImageFormat.JPEG,
      quality: 80,
    },
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

  let configMock: Mocked<IConfigRepository>;
  let eventMock: Mocked<IEventRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, configMock, eventMock, loggerMock, systemMock } = newTestService(SystemConfigService));
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

      await expect(sut.getSystemConfig()).resolves.toEqual(defaults);
    });

    it('should merge the overrides', async () => {
      systemMock.get.mockResolvedValue({
        ffmpeg: { crf: 30 },
        oauth: { autoLaunch: true },
        trash: { days: 10 },
        user: { deleteDelay: 15 },
      });

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);
    });

    it('should load the config from a json file', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      systemMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should log errors with the config file', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));

      systemMock.readFile.mockResolvedValue(`{ "ffmpeg2": true, "ffmpeg2": true }`);

      await expect(sut.getSystemConfig()).rejects.toBeInstanceOf(Error);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.json');
      expect(loggerMock.error).toHaveBeenCalledTimes(2);
      expect(loggerMock.error.mock.calls[0][0]).toEqual('Unable to load configuration file: immich-config.json');
      expect(loggerMock.error.mock.calls[1][0].toString()).toEqual(
        expect.stringContaining('YAMLException: duplicated mapping key (1:20)'),
      );
    });

    it('should load the config from a yaml file', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
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

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.yaml');
    });

    it('should accept an empty configuration file', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      systemMock.readFile.mockResolvedValue(JSON.stringify({}));

      await expect(sut.getSystemConfig()).resolves.toEqual(defaults);

      expect(systemMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should allow underscores in the machine learning url', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      const partialConfig = { machineLearning: { url: 'immich_machine_learning' } };
      systemMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await sut.getSystemConfig();
      expect(config.machineLearning.url).toEqual('immich_machine_learning');
    });

    const externalDomainTests = [
      { should: 'with a trailing slash', externalDomain: 'https://demo.immich.app/' },
      { should: 'without a trailing slash', externalDomain: 'https://demo.immich.app' },
      { should: 'with a port', externalDomain: 'https://demo.immich.app:42', result: 'https://demo.immich.app:42' },
    ];

    for (const { should, externalDomain, result } of externalDomainTests) {
      it(`should normalize an external domain ${should}`, async () => {
        configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        const partialConfig = { server: { externalDomain } };
        systemMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

        const config = await sut.getSystemConfig();
        expect(config.server.externalDomain).toEqual(result ?? 'https://demo.immich.app');
      });
    }

    it('should warn for unknown options in yaml', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
      const partialConfig = `
        unknownOption: true
      `;
      systemMock.readFile.mockResolvedValue(partialConfig);

      await sut.getSystemConfig();
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
        configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        systemMock.readFile.mockResolvedValue(JSON.stringify(test.config));

        if (test.warn) {
          await sut.getSystemConfig();
          expect(loggerMock.warn).toHaveBeenCalled();
        } else {
          await expect(sut.getSystemConfig()).rejects.toBeInstanceOf(Error);
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
          '{{y}}/{{#if album}}{{album}}{{else}}Other/{{MM}}{{/if}}/{{filename}}',
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
    it('should update the config and emit an event', async () => {
      systemMock.get.mockResolvedValue(partialConfig);
      await expect(sut.updateSystemConfig(updatedConfig)).resolves.toEqual(updatedConfig);
      expect(eventMock.emit).toHaveBeenCalledWith(
        'config.update',
        expect.objectContaining({ oldConfig: expect.any(Object), newConfig: updatedConfig }),
      );
    });

    it('should throw an error if a config file is in use', async () => {
      configMock.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      systemMock.readFile.mockResolvedValue(JSON.stringify({}));
      await expect(sut.updateSystemConfig(defaults)).rejects.toBeInstanceOf(BadRequestException);
      expect(systemMock.set).not.toHaveBeenCalled();
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });
  });
});
