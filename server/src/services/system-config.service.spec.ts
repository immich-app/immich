import { BadRequestException } from '@nestjs/common';
import { defaults, SystemConfig } from 'src/config';
import {
  AudioCodec,
  Colorspace,
  CQMode,
  ImageFormat,
  LogLevel,
  OAuthTokenEndpointAuthMethod,
  QueueName,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { SystemConfigService } from 'src/services/system-config.service';
import { DeepPartial } from 'src/types';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';

const partialConfig = {
  ffmpeg: { crf: 30 },
  oauth: { autoLaunch: true },
  trash: { days: 10 },
  user: { deleteDelay: 15 },
} satisfies DeepPartial<SystemConfig>;

const updatedConfig = Object.freeze<SystemConfig>({
  job: {
    [QueueName.BackgroundTask]: { concurrency: 5 },
    [QueueName.SmartSearch]: { concurrency: 2 },
    [QueueName.MetadataExtraction]: { concurrency: 5 },
    [QueueName.FaceDetection]: { concurrency: 2 },
    [QueueName.Search]: { concurrency: 5 },
    [QueueName.Sidecar]: { concurrency: 5 },
    [QueueName.Library]: { concurrency: 5 },
    [QueueName.Migration]: { concurrency: 5 },
    [QueueName.ThumbnailGeneration]: { concurrency: 3 },
    [QueueName.VideoConversion]: { concurrency: 1 },
    [QueueName.Notification]: { concurrency: 5 },
    [QueueName.Ocr]: { concurrency: 1 },
    [QueueName.Workflow]: { concurrency: 5 },
    [QueueName.Editor]: { concurrency: 2 },
  },
  backup: {
    database: {
      enabled: true,
      cronExpression: '0 02 * * *',
      keepLastAmount: 14,
    },
  },
  ffmpeg: {
    crf: 30,
    threads: 0,
    preset: 'ultrafast',
    targetAudioCodec: AudioCodec.Aac,
    acceptedAudioCodecs: [AudioCodec.Aac, AudioCodec.Mp3, AudioCodec.LibOpus],
    targetResolution: '720',
    targetVideoCodec: VideoCodec.H264,
    acceptedVideoCodecs: [VideoCodec.H264],
    acceptedContainers: [VideoContainer.Mov, VideoContainer.Ogg, VideoContainer.Webm],
    maxBitrate: '0',
    bframes: -1,
    refs: 0,
    gopSize: 0,
    temporalAQ: false,
    cqMode: CQMode.Auto,
    twoPass: false,
    preferredHwDevice: 'auto',
    transcode: TranscodePolicy.Required,
    accel: TranscodeHardwareAcceleration.Disabled,
    accelDecode: false,
    tonemap: ToneMapping.Hable,
  },
  logging: {
    enabled: true,
    level: LogLevel.Log,
  },
  metadata: {
    faces: {
      import: false,
    },
  },
  machineLearning: {
    enabled: true,
    urls: ['http://immich-machine-learning:3003'],
    availabilityChecks: {
      enabled: true,
      interval: 30_000,
      timeout: 2000,
    },
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
    ocr: {
      enabled: true,
      modelName: 'PP-OCRv5_mobile',
      minDetectionScore: 0.5,
      minRecognitionScore: 0.8,
      maxResolution: 736,
    },
  },
  map: {
    enabled: true,
    lightStyle: 'https://tiles.immich.cloud/v1/style/light.json',
    darkStyle: 'https://tiles.immich.cloud/v1/style/dark.json',
  },
  nightlyTasks: {
    startTime: '00:00',
    databaseCleanup: true,
    clusterNewFaces: true,
    missingThumbnails: true,
    generateMemories: true,
    syncQuotaUsage: true,
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
    defaultStorageQuota: null,
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    profileSigningAlgorithm: 'none',
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod.ClientSecretPost,
    timeout: 30_000,
    storageLabelClaim: 'preferred_username',
    storageQuotaClaim: 'immich_quota',
    roleClaim: 'immich_role',
  },
  passwordLogin: {
    enabled: true,
  },
  server: {
    externalDomain: '',
    loginPageMessage: '',
    publicUsers: true,
  },
  storageTemplate: {
    enabled: false,
    hashVerificationEnabled: true,
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },
  image: {
    thumbnail: {
      size: 250,
      format: ImageFormat.Webp,
      quality: 80,
      progressive: false,
    },
    preview: {
      size: 1440,
      format: ImageFormat.Jpeg,
      quality: 80,
      progressive: false,
    },
    fullsize: { enabled: false, format: ImageFormat.Jpeg, quality: 80, progressive: false },
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
        secure: false,
        username: '',
        password: '',
        ignoreCert: false,
      },
    },
  },
  templates: {
    email: {
      albumInviteTemplate: '',
      welcomeTemplate: '',
      albumUpdateTemplate: '',
    },
  },
});

describe(SystemConfigService.name, () => {
  let sut: SystemConfigService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SystemConfigService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDefaults', () => {
    it('should return the default config', () => {
      mocks.systemMetadata.get.mockResolvedValue(partialConfig);

      expect(sut.getDefaults()).toEqual(defaults);
      expect(mocks.systemMetadata.get).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return the default config', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});

      await expect(sut.getSystemConfig()).resolves.toEqual(defaults);
    });

    it('should merge the overrides', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { crf: 30 },
        oauth: { autoLaunch: true },
        trash: { days: 10 },
        user: { deleteDelay: 15 },
      });

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);
    });

    it('should load the config from a json file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should transform booleans', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { twoPass: 'false' } }));

      await expect(sut.getSystemConfig()).resolves.toMatchObject({
        ffmpeg: expect.objectContaining({ twoPass: false }),
      });
    });

    it('should transform numbers', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { threads: '42' } }));

      await expect(sut.getSystemConfig()).resolves.toMatchObject({
        ffmpeg: expect.objectContaining({ threads: 42 }),
      });
    });

    it('should accept valid cron expressions', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({ library: { scan: { cronExpression: '0 0 * * *' } } }),
      );

      await expect(sut.getSystemConfig()).resolves.toMatchObject({
        library: {
          scan: {
            enabled: true,
            cronExpression: '0 0 * * *',
          },
        },
      });
    });

    it('should reject invalid cron expressions', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ library: { scan: { cronExpression: 'foo' } } }));

      await expect(sut.getSystemConfig()).rejects.toThrow(
        'library.scan.cronExpression has failed the following constraints: cronValidator',
      );
    });

    it('should log errors with the config file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));

      mocks.systemMetadata.readFile.mockResolvedValue(`{ "ffmpeg2": true, "ffmpeg2": true }`);

      await expect(sut.getSystemConfig()).rejects.toBeInstanceOf(Error);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
      expect(mocks.logger.error).toHaveBeenCalledTimes(2);
      expect(mocks.logger.error.mock.calls[0][0]).toEqual('Unable to load configuration file: immich-config.json');
      expect(mocks.logger.error.mock.calls[1][0].toString()).toEqual(
        expect.stringContaining('YAMLException: duplicated mapping key (1:20)'),
      );
    });

    it('should load the config from a yaml file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
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
      mocks.systemMetadata.readFile.mockResolvedValue(partialConfig);

      await expect(sut.getSystemConfig()).resolves.toEqual(updatedConfig);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.yaml');
    });

    it('should accept an empty configuration file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({}));

      await expect(sut.getSystemConfig()).resolves.toEqual(defaults);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should auto-add targetAudioCodec to acceptedAudioCodecs if not present', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({
          ffmpeg: {
            targetAudioCodec: AudioCodec.Aac,
            acceptedAudioCodecs: [AudioCodec.Mp3],
          },
        }),
      );

      const config = await sut.getSystemConfig();
      expect(config.ffmpeg.acceptedAudioCodecs).toContain(AudioCodec.Aac);
    });

    it('should allow underscores in the machine learning url', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      const partialConfig = { machineLearning: { urls: ['immich_machine_learning'] } };
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await sut.getSystemConfig();
      expect(config.machineLearning.urls).toEqual(['immich_machine_learning']);
    });

    const externalDomainTests = [
      { should: 'with a trailing slash', externalDomain: 'https://demo.immich.app/' },
      { should: 'without a trailing slash', externalDomain: 'https://demo.immich.app' },
      { should: 'with a port', externalDomain: 'https://demo.immich.app:42', result: 'https://demo.immich.app:42' },
      {
        should: 'with basic auth',
        externalDomain: 'https://user:password@example.com:123',
        result: 'https://user:password@example.com:123',
      },
    ];

    for (const { should, externalDomain, result } of externalDomainTests) {
      it(`should normalize an external domain ${should}`, async () => {
        mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        const partialConfig = { server: { externalDomain } };
        mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

        const config = await sut.getSystemConfig();
        expect(config.server.externalDomain).toEqual(result ?? 'https://demo.immich.app');
      });
    }

    it('should warn for unknown options in yaml', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
      const partialConfig = `
        unknownOption: true
      `;
      mocks.systemMetadata.readFile.mockResolvedValue(partialConfig);

      await sut.getSystemConfig();
      expect(mocks.logger.warn).toHaveBeenCalled();
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
        mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(test.config));

        if (test.warn) {
          await sut.getSystemConfig();
          expect(mocks.logger.warn).toHaveBeenCalled();
        } else {
          await expect(sut.getSystemConfig()).rejects.toBeInstanceOf(Error);
        }
      });
    }
  });

  describe('updateConfig', () => {
    it('should update the config and emit an event', async () => {
      mocks.systemMetadata.get.mockResolvedValue(partialConfig);
      await expect(sut.updateSystemConfig(updatedConfig)).resolves.toEqual(updatedConfig);
      expect(mocks.event.emit).toHaveBeenCalledWith(
        'ConfigUpdate',
        expect.objectContaining({ oldConfig: expect.any(Object), newConfig: updatedConfig }),
      );
    });

    it('should throw an error if a config file is in use', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({}));
      await expect(sut.updateSystemConfig(defaults)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });
  });

  describe('onBootstrap', () => {
    it('should emit ConfigInit event with the config', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});

      await sut.onBootstrap();

      expect(mocks.event.emit).toHaveBeenCalledWith('ConfigInit', { newConfig: expect.any(Object) });
    });

    it('should log deprecation warning when IMMICH_MACHINE_LEARNING_PING_TIMEOUT is set', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      process.env.IMMICH_MACHINE_LEARNING_PING_TIMEOUT = '5000';

      await sut.onBootstrap();

      expect(mocks.logger.deprecate).toHaveBeenCalled();

      delete process.env.IMMICH_MACHINE_LEARNING_PING_TIMEOUT;
    });

    it('should log deprecation warning when IMMICH_MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME is set', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      process.env.IMMICH_MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME = '10000';

      await sut.onBootstrap();

      expect(mocks.logger.deprecate).toHaveBeenCalled();

      delete process.env.IMMICH_MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME;
    });

    it('should not log deprecation warning when neither env var is set', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      delete process.env.IMMICH_MACHINE_LEARNING_PING_TIMEOUT;
      delete process.env.IMMICH_MACHINE_LEARNING_AVAILABILITY_BACKOFF_TIME;

      await sut.onBootstrap();

      expect(mocks.logger.deprecate).not.toHaveBeenCalled();
    });
  });

  describe('onShutdown', () => {
    it('should teardown machine learning repository', () => {
      sut.onShutdown();

      expect(mocks.machineLearning.teardown).toHaveBeenCalled();
    });
  });

  describe('onConfigInit', () => {
    it('should set log level from config when no env level is set', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({}));

      sut.onConfigInit({
        newConfig: {
          ...defaults,
          logging: { enabled: true, level: LogLevel.Debug },
        },
      });

      expect(mocks.logger.setLogLevel).toHaveBeenCalledWith(LogLevel.Debug);
    });

    it('should use env log level when set', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ logLevel: LogLevel.Verbose }));

      sut.onConfigInit({
        newConfig: {
          ...defaults,
          logging: { enabled: true, level: LogLevel.Debug },
        },
      });

      expect(mocks.logger.setLogLevel).toHaveBeenCalledWith(LogLevel.Verbose);
    });

    it('should set log level to false when logging is disabled', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({}));

      sut.onConfigInit({
        newConfig: {
          ...defaults,
          logging: { enabled: false, level: LogLevel.Log },
        },
      });

      expect(mocks.logger.setLogLevel).toHaveBeenCalledWith(false);
    });

    it('should setup machine learning repository', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({}));

      sut.onConfigInit({
        newConfig: defaults,
      });

      expect(mocks.machineLearning.setup).toHaveBeenCalledWith(defaults.machineLearning);
    });
  });

  describe('onConfigUpdate', () => {
    it('should call onConfigInit and clear the config cache', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({}));

      sut.onConfigUpdate({
        newConfig: defaults,
        oldConfig: defaults,
      });

      expect(mocks.logger.setLogLevel).toHaveBeenCalled();
      expect(mocks.machineLearning.setup).toHaveBeenCalled();
    });
  });

  describe('onConfigValidate', () => {
    it('should not throw when logging config changes and no env log level is set', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({}));

      expect(() =>
        sut.onConfigValidate({
          newConfig: { ...defaults, logging: { enabled: true, level: LogLevel.Debug } },
          oldConfig: defaults,
        }),
      ).not.toThrow();
    });

    it('should throw when logging config changes while IMMICH_LOG_LEVEL env var is set', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ logLevel: LogLevel.Verbose }));

      expect(() =>
        sut.onConfigValidate({
          newConfig: { ...defaults, logging: { enabled: true, level: LogLevel.Debug } },
          oldConfig: defaults,
        }),
      ).toThrow('Logging cannot be changed while the environment variable IMMICH_LOG_LEVEL is set.');
    });

    it('should not throw when logging config has not changed even with env var set', () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ logLevel: LogLevel.Verbose }));

      expect(() =>
        sut.onConfigValidate({
          newConfig: defaults,
          oldConfig: defaults,
        }),
      ).not.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('should throw a BadRequestException when validation fails', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      mocks.event.emit.mockImplementation((event) => {
        if (event === 'ConfigValidate') {
          throw new Error('Validation failed');
        }
        return undefined as any;
      });

      await expect(sut.updateSystemConfig(defaults)).rejects.toThrow(BadRequestException);
      expect(mocks.logger.warn).toHaveBeenCalled();
    });

    it('should wrap non-Error validation failures in a BadRequestException', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});
      mocks.event.emit.mockImplementation((event) => {
        if (event === 'ConfigValidate') {
          throw 'string error';
        }
        return undefined as any;
      });

      await expect(sut.updateSystemConfig(defaults)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });

    it('should return custom CSS when set', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ theme: { customCss: 'body { color: red; }' } });

      await expect(sut.getCustomCss()).resolves.toEqual('body { color: red; }');
    });
  });
});
