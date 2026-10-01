import { BadRequestException } from '@nestjs/common';
import { get } from 'lodash-es';
import type { DeepPartial } from 'src/types.js';
import { SystemConfig, defaults } from 'src/dtos/config.dto.js';
import {
  AudioCodec,
  CQMode,
  Colorspace,
  ConfigSource,
  HlsVideoResolution,
  ImageFormat,
  LogLevel,
  OAuthTokenEndpointAuthMethod,
  QueueName,
  ReleaseChannel,
  SystemMetadataKey,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  VideoCodec,
  VideoContainer,
} from 'src/enum.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import { mockEnvData } from 'test/repositories/config.repository.mock.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

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
    [QueueName.IntegrityCheck]: { concurrency: 1 },
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
    acceptedAudioCodecs: [AudioCodec.Aac, AudioCodec.Mp3, AudioCodec.Opus],
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
    accelDecode: true,
    tonemap: ToneMapping.Hable,
    realtime: {
      enabled: false,
      videoCodecs: [VideoCodec.H264, VideoCodec.Hevc],
      resolutions: [HlsVideoResolution.p480, HlsVideoResolution.p720, HlsVideoResolution.p1080],
    },
  },
  integrityChecks: {
    untrackedFiles: {
      enabled: true,
      cronExpression: '0 03 * * *',
    },
    missingFiles: {
      enabled: true,
      cronExpression: '0 03 * * *',
    },
    checksumFiles: {
      enabled: true,
      cronExpression: '0 03 * * *',
      timeLimit: 60 * 60 * 1000,
      percentageLimit: 1,
    },
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
    accountManagementUrl: '',
    autoLaunch: true,
    autoRegister: true,
    buttonText: 'Login with OAuth',
    clientId: '',
    clientSecret: '',
    defaultStorageQuota: null,
    enabled: false,
    issuerUrl: '',
    endSessionEndpoint: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    prompt: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    profileSigningAlgorithm: 'none',
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod.ClientSecretPost,
    timeout: 30_000,
    allowInsecureRequests: false,
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
    channel: ReleaseChannel.Stable,
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

      expect(sut.getAdminConfigDefaults()).toEqual(defaults);
      expect(mocks.systemMetadata.get).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return the default config', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});

      await expect(sut.getAdminConfig()).resolves.toEqual(defaults);
    });

    it('should merge the overrides', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        ffmpeg: { crf: 30 },
        oauth: { autoLaunch: true },
        trash: { days: 10 },
        user: { deleteDelay: 15 },
      });

      await expect(sut.getAdminConfig()).resolves.toEqual(updatedConfig);
    });

    it('should layer the config file over the database', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 }, trash: { days: 10 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      const config = await sut.getAdminConfig();
      expect(config.ffmpeg.crf).toBe(30);
      expect(config.trash.days).toBe(10);
    });

    it('should apply environment variable overrides', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          configOverrides: {
            IMMICH_CONFIG_FFMPEG_CRF: '30',
            IMMICH_CONFIG_OAUTH_AUTO_LAUNCH: 'true',
            IMMICH_CONFIG_TRASH_DAYS: '10',
            IMMICH_CONFIG_USER_DELETE_DELAY: '15',
          },
        }),
      );
      mocks.systemMetadata.get.mockResolvedValue({});

      await expect(sut.getAdminConfig()).resolves.toEqual(updatedConfig);
    });

    it('should parse the default value of every property from an environment variable', async () => {
      const configOverrides: Record<string, string> = {};
      for (const { key, envName } of await sut.getAdminConfigFields()) {
        const value: unknown = get(defaults, key);
        if (value !== null) {
          configOverrides[envName] = typeof value === 'string' ? value : JSON.stringify(value);
        }
      }
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides }));

      await expect(sut.getAdminConfig()).resolves.toEqual(defaults);
      expect(mocks.logger.warn).not.toHaveBeenCalled();

      for (const field of await sut.getAdminConfigFields()) {
        if (get(defaults, field.key) !== null) {
          expect(field.sources.at(-1)?.source, field.key).toBe(ConfigSource.Env);
        }
      }
    });

    it('should parse array environment variable overrides', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          configOverrides: {
            IMMICH_CONFIG_MACHINE_LEARNING_URLS: 'http://ml1:3003, http://ml2:3003',
            IMMICH_CONFIG_FFMPEG_ACCEPTED_VIDEO_CODECS: '["hevc"]',
          },
        }),
      );

      const config = await sut.getAdminConfig();
      expect(config.machineLearning.urls).toEqual(['http://ml1:3003', 'http://ml2:3003']);
      expect(config.ffmpeg.acceptedVideoCodecs).toEqual([VideoCodec.Hevc, VideoCodec.H264]);
    });

    it('should prefer environment variables over the config file', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configFile: 'immich-config.json', configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '30' } }),
      );
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 25 } }));

      const config = await sut.getAdminConfig();
      expect(config.ffmpeg.crf).toBe(30);
    });

    it('should throw for an invalid environment variable override', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: 'not-a-number' } }),
      );

      await expect(sut.getAdminConfig()).rejects.toThrow('[ffmpeg.crf]');
    });

    it('should throw for an empty environment variable override', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_TRASH_DAYS: '' } }));

      await expect(sut.getAdminConfig()).rejects.toThrow('[trash.days]');
    });

    it('should warn for unknown environment variable overrides', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_UNKNOWN: 'true' } }));

      await sut.getAdminConfig();
      expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('IMMICH_CONFIG_UNKNOWN'));
    });

    it('should load the config from a json file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      await expect(sut.getAdminConfig()).resolves.toEqual(updatedConfig);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should transform booleans', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { twoPass: 'false' } }));

      await expect(sut.getAdminConfig()).resolves.toMatchObject({
        ffmpeg: expect.objectContaining({ twoPass: false }),
      });
    });

    it('should transform numbers', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { threads: '42' } }));

      await expect(sut.getAdminConfig()).resolves.toMatchObject({
        ffmpeg: expect.objectContaining({ threads: 42 }),
      });
    });

    it('should accept valid cron expressions', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({ library: { scan: { cronExpression: '0 0 */3 * *' } } }),
      );

      await expect(sut.getAdminConfig()).resolves.toMatchObject({
        library: {
          scan: {
            enabled: true,
            cronExpression: '0 0 */3 * *',
          },
        },
      });
    });

    it('should reject an invalid issuer URL', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ oauth: { issuerUrl: 'accounts.google.com' } }));

      await expect(sut.getAdminConfig()).rejects.toThrow(
        '[oauth.issuerUrl] Issuer URL must be an empty string or a valid URL',
      );
    });

    it('should reject invalid cron expressions', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ library: { scan: { cronExpression: 'foo' } } }));

      await expect(sut.getAdminConfig()).rejects.toThrow('[library.scan.cronExpression] Invalid cron expression');
    });

    it('should log errors with the config file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));

      mocks.systemMetadata.readFile.mockResolvedValue(`{ "ffmpeg2": true, "ffmpeg2": true }`);

      await expect(sut.getAdminConfig()).rejects.toBeInstanceOf(Error);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
      expect(mocks.logger.error).toHaveBeenCalledTimes(2);
      expect(mocks.logger.error.mock.calls[0][0]).toEqual('Unable to load configuration file: immich-config.json');
      expect(mocks.logger.error.mock.calls[1][0].toString()).toEqual(
        expect.stringContaining('YAMLException: duplicated mapping key (1:21)'),
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

      await expect(sut.getAdminConfig()).resolves.toEqual(updatedConfig);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.yaml');
    });

    it('should accept an empty configuration file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({}));

      await expect(sut.getAdminConfig()).resolves.toEqual(defaults);

      expect(mocks.systemMetadata.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should allow underscores in the machine learning url', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      const partialConfig = { machineLearning: { urls: ['immich_machine_learning'] } };
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await sut.getAdminConfig();
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

        const config = await sut.getAdminConfig();
        expect(config.server.externalDomain).toEqual(result ?? 'https://demo.immich.app');
      });
    }

    it('should warn for unknown options in yaml', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
      const partialConfig = `
        unknownOption: true
      `;
      mocks.systemMetadata.readFile.mockResolvedValue(partialConfig);

      await sut.getAdminConfig();
      expect(mocks.logger.warn).toHaveBeenCalled();
    });

    const tests = [
      {
        should: 'validate numbers',
        config: { ffmpeg: { crf: 'not-a-number' } },
        throws: '[ffmpeg.crf] Invalid input: expected number, received NaN',
      },
      {
        should: 'validate booleans',
        config: { oauth: { enabled: 'invalid' } },
        throws: '[oauth.enabled] Invalid input: expected boolean, received string',
      },
      {
        should: 'validate enums',
        config: { ffmpeg: { transcode: 'unknown' } },
        throws: '[ffmpeg.transcode] Invalid option: expected one of',
      },
      {
        should: 'validate required oauth fields',
        config: { oauth: { enabled: true } },
        check: (c: SystemConfig) => expect(c.oauth.enabled).toBe(true),
      },
      { should: 'warn for top level unknown options', warn: true, config: { unknownOption: true } },
      { should: 'warn for nested unknown options', warn: true, config: { ffmpeg: { unknownOption: true } } },
    ];

    for (const test of tests) {
      it(`should ${test.should}`, async () => {
        mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(test.config));

        if (test.throws) {
          await expect(sut.getAdminConfig()).rejects.toThrow(test.throws);
        } else if (test.warn) {
          await sut.getAdminConfig();
          expect(mocks.logger.warn).toHaveBeenCalled();
        } else {
          const config = await sut.getAdminConfig();
          test.check!(config);
        }
      });
    }
  });

  describe('getAdminConfigFields', () => {
    it('should report where each value came from', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configFile: 'immich-config.json', configOverrides: { IMMICH_CONFIG_TRASH_DAYS: '10' } }),
      );
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 }, user: { deleteDelay: 15 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      const response = await sut.getAdminConfigFields();
      const fields = Object.fromEntries(response.map((field) => [field.key, field]));

      expect(fields['ffmpeg.threads']).toEqual({
        key: 'ffmpeg.threads',
        envName: 'IMMICH_CONFIG_FFMPEG_THREADS',
        value: 0,
        sources: [{ source: ConfigSource.Default, value: 0 }],
        isEditable: true,
      });
      expect(fields['user.deleteDelay']).toEqual({
        key: 'user.deleteDelay',
        envName: 'IMMICH_CONFIG_USER_DELETE_DELAY',
        value: 15,
        sources: [
          { source: ConfigSource.Default, value: 7 },
          { source: ConfigSource.Database, value: 15 },
        ],
        isEditable: true,
      });
      expect(fields['ffmpeg.crf']).toEqual({
        key: 'ffmpeg.crf',
        envName: 'IMMICH_CONFIG_FFMPEG_CRF',
        value: 30,
        sources: [
          { source: ConfigSource.Default, value: 23 },
          { source: ConfigSource.Database, value: 25 },
          { source: ConfigSource.File, value: 30 },
        ],
        isEditable: false,
      });
      expect(fields['trash.days']).toEqual({
        key: 'trash.days',
        envName: 'IMMICH_CONFIG_TRASH_DAYS',
        value: 10,
        sources: [
          { source: ConfigSource.Default, value: 30 },
          { source: ConfigSource.Env, value: '10' },
        ],
        isEditable: false,
      });
    });

    it('should report the effective value after normalization', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({ server: { externalDomain: 'https://demo.immich.app/' } }),
      );

      const fields = await sut.getAdminConfigFields();

      expect(fields.find((field) => field.key === 'server.externalDomain')).toMatchObject({
        value: 'https://demo.immich.app',
        sources: [
          { source: ConfigSource.Default, value: '' },
          { source: ConfigSource.File, value: 'https://demo.immich.app/' },
        ],
        isEditable: false,
      });
    });
  });

  describe('updateConfig', () => {
    it('should update the config and emit an event', async () => {
      mocks.systemMetadata.get.mockResolvedValue(partialConfig);
      await expect(sut.updateAdminConfig(updatedConfig)).resolves.toEqual(updatedConfig);
      expect(mocks.event.emit).toHaveBeenCalledWith(
        'ConfigUpdate',
        expect.objectContaining({ oldConfig: expect.any(Object), newConfig: updatedConfig }),
      );
    });

    it('should reject changes to properties set by the config file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      await expect(sut.updateAdminConfig(defaults)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.updateAdminConfig(defaults)).rejects.toThrow('ffmpeg.crf (config file)');
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should reject changes to properties set by an environment variable', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '30' } }));

      await expect(sut.updateAdminConfig(defaults)).rejects.toThrow(
        'ffmpeg.crf (environment variable IMMICH_CONFIG_FFMPEG_CRF)',
      );
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should report every non-editable property that was changed', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          configFile: 'immich-config.json',
          configOverrides: { IMMICH_CONFIG_TRASH_DAYS: '10' },
        }),
      );
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      await expect(sut.updateAdminConfig(defaults)).rejects.toThrow(
        'ffmpeg.crf (config file), trash.days (environment variable IMMICH_CONFIG_TRASH_DAYS)',
      );
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('should update the remaining properties when a config file is in use', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      await sut.updateAdminConfig(updatedConfig);

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.SystemConfig, {
        oauth: { autoLaunch: true },
        trash: { days: 10 },
        user: { deleteDelay: 15 },
      });
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });
  });
});
