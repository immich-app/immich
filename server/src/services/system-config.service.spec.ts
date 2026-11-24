import { BadRequestException } from '@nestjs/common';
import { get, snakeCase } from 'lodash-es';
import { SystemConfig, configFields, defaults } from 'src/dtos/config.dto.js';
import {
  AudioCodec,
  CQMode,
  Colorspace,
  ConfigSource,
  HlsVideoResolution,
  ImageEffort,
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
import { Resource } from 'src/resource-paths.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import type { DeepPartial } from 'src/types.js';
import { mockEnvData } from 'test/repositories/config.repository.mock.js';
import { mockAdmins } from 'test/repositories/user.repository.mock.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

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
    beta: false,
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
  passkey: {
    enabled: true,
    domain: null,
    additionalDomains: [],
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
      size: 360,
      format: ImageFormat.Webp,
      quality: 80,
      progressive: false,
      effort: ImageEffort.Medium,
    },
    preview: {
      size: 1440,
      format: ImageFormat.Jpeg,
      quality: 80,
      progressive: false,
      effort: ImageEffort.Medium,
    },
    fullsize: { enabled: false, format: ImageFormat.Jpeg, quality: 80, progressive: false, effort: ImageEffort.Medium },
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
    mocks.user.getAdminIds.mockResolvedValue([]);
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

    it('applies an environment variable override', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '30', IMMICH_CONFIG_TRASH_ENABLED: 'false' } }),
      );

      const config = await sut.getAdminConfig();

      expect(config.ffmpeg.crf).toBe(30);
      expect(config.trash.enabled).toBe(false);
    });

    it('lets an environment variable win over the config file and the database', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configFile: 'immich-config.json', configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '35' } }),
      );
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      const config = await sut.getAdminConfig();

      expect(config.ffmpeg.crf).toBe(35);
    });

    it('sets every property from its environment variable', async () => {
      const configOverrides = Object.fromEntries(
        configFields.map(({ key }) => {
          const value = get(defaults, key);
          const serialized = Array.isArray(value) || value === null ? JSON.stringify(value) : String(value);
          return [`IMMICH_CONFIG_${snakeCase(key).toUpperCase()}`, serialized];
        }),
      );
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides }));
      mocks.systemMetadata.get.mockResolvedValue(partialConfig);

      const config = await sut.getAdminConfig();

      expect(Object.keys(configOverrides)).toHaveLength(configFields.length);
      expect(config).toEqual(defaults);
      expect(mocks.logger.warn).not.toHaveBeenCalled();
    });

    const codecs = { variable: 'IMMICH_CONFIG_FFMPEG_ACCEPTED_VIDEO_CODECS', path: 'ffmpeg.acceptedVideoCodecs' };
    const urls = { variable: 'IMMICH_CONFIG_MACHINE_LEARNING_URLS', path: 'machineLearning.urls' };
    it.each([
      { ...codecs, value: 'h264, hevc,', expected: ['h264', 'hevc'] },
      { ...codecs, value: '["h264","hevc"]', expected: ['h264', 'hevc'] },
      { ...urls, value: 'http://ml:3003', expected: ['http://ml:3003'] },
    ])('decodes $variable=$value as an array', async ({ variable, path, value, expected }) => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { [variable]: value } }));

      const config = await sut.getAdminConfig();

      expect(get(config, path)).toEqual(expected);
    });

    it.each(['123', '"123"'])('keeps %s as is for a string property', async (value) => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_OAUTH_CLIENT_ID: value } }));

      const config = await sut.getAdminConfig();

      expect(config.oauth.clientId).toBe(value);
    });

    it.each([
      { variable: 'IMMICH_CONFIG_USER_DELETE_DELAY', value: '0', reason: 'Too small: expected number to be >=1' },
      { variable: 'IMMICH_CONFIG_FFMPEG_CRF', value: '99', reason: 'Too big: expected number to be <=51' },
      { variable: 'IMMICH_CONFIG_FFMPEG_CRF', value: 'abc', reason: 'Invalid input: expected number, received NaN' },
      {
        variable: 'IMMICH_CONFIG_FFMPEG_ACCEPTED_VIDEO_CODECS',
        value: 'h264,nope',
        reason: '[1] Invalid option: expected one of "h264"|"hevc"|"vp9"|"av1"',
      },
      {
        variable: 'IMMICH_CONFIG_TRASH_ENABLED',
        value: 'yes',
        reason: 'Invalid input: expected boolean, received string',
      },
    ])('throws for an invalid $variable=$value', async ({ variable, value, reason }) => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { [variable]: value } }));

      await expect(sut.getAdminConfig()).rejects.toThrow(
        new Error(`Invalid config environment variables:\n  ${variable}=${value}: ${reason}`),
      );
    });

    it('decodes environment variables when a database value is invalid', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_TRASH_ENABLED: 'false' } }));
      mocks.systemMetadata.get.mockResolvedValue({ user: { deleteDelay: 0 } });

      const config = await sut.getAdminConfig();

      expect(config.trash.enabled).toBe(false);
    });

    it('warns for an unknown environment variable', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_NOPE: '1' } }));

      await sut.getAdminConfig();

      expect(mocks.logger.warn).toHaveBeenCalledWith('Unknown configuration environment variable: IMMICH_CONFIG_NOPE');
    });

    it('should drop and log an invalid database value', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ user: { deleteDelay: 0 }, trash: { days: 10 } });

      const config = await sut.getAdminConfig();

      expect(config.user.deleteDelay).toBe(7);
      expect(config.trash.days).toBe(10);
      expect(mocks.logger.warn).toHaveBeenCalledWith(
        'Ignoring invalid database config:\n  user.deleteDelay=0: Too small: expected number to be >=1',
      );
      expect(mocks.logger.error).not.toHaveBeenCalled();
    });

    it('should drop an invalid database value with a config file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.get.mockResolvedValue({ user: { deleteDelay: 0 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ trash: { days: 10 } }));

      const config = await sut.getAdminConfig();

      expect(config.user.deleteDelay).toBe(7);
      expect(config.trash.days).toBe(10);
    });

    it('should throw for an invalid config file value', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.get.mockResolvedValue({ user: { deleteDelay: 15 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 99 } }));

      await expect(sut.getAdminConfig()).rejects.toThrow(
        new Error('Invalid config file immich-config.json:\n  ffmpeg.crf=99: Too big: expected number to be <=51'),
      );
    });

    it('masks a secret in a config file error', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({ notifications: { smtp: { transport: { password: 5 } } } }),
      );

      await expect(sut.getAdminConfig()).rejects.toThrow(
        new Error(
          'Invalid config file immich-config.json:\n  notifications.smtp.transport.password=****: Invalid input: expected string, received number',
        ),
      );
    });

    it('truncates a long value in a config file error', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 'x'.repeat(200) } }));

      await expect(sut.getAdminConfig()).rejects.toThrow(
        new Error(
          `Invalid config file immich-config.json:\n  ffmpeg.crf="${'x'.repeat(99)}…: Invalid input: expected number, received NaN`,
        ),
      );
    });

    it('throws for an invalid combination of config file values', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(
        JSON.stringify({
          passkey: { domain: 'https://immich.example', additionalDomains: ['https://immich.example'] },
        }),
      );

      await expect(sut.getAdminConfig()).rejects.toThrow(
        new Error(
          'Invalid config:\n  passkey: The passkey domain is always allowed and must not be listed as an additional domain',
        ),
      );
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
        'oauth.issuerUrl="accounts.google.com": Issuer URL must be an empty string or a valid URL',
      );
    });

    it('should reject invalid cron expressions', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ library: { scan: { cronExpression: 'foo' } } }));

      await expect(sut.getAdminConfig()).rejects.toThrow('library.scan.cronExpression="foo": Invalid cron expression');
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

    for (const { should, externalDomain, result = 'https://demo.immich.app' } of externalDomainTests) {
      it(`should normalize an external domain ${should}`, async () => {
        mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
        const partialConfig = { server: { externalDomain } };
        mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify(partialConfig));

        const config = await sut.getAdminConfig();
        expect(config.server.externalDomain).toEqual(result);
      });
    }

    it('should warn for unknown options in yaml', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.yaml' }));
      const partialConfig = `
        unknownOption: true
      `;
      mocks.systemMetadata.readFile.mockResolvedValue(partialConfig);

      await sut.getAdminConfig();
      expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown keys found in file config: '));
    });

    it('should warn for unknown options in the database', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ unknownOption: true } as never);

      await sut.getAdminConfig();
      expect(mocks.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown keys found in database config: '),
      );
    });

    const tests = [
      {
        should: 'validate numbers',
        config: { ffmpeg: { crf: 'not-a-number' } },
        throws: 'ffmpeg.crf="not-a-number": Invalid input: expected number, received NaN',
      },
      {
        should: 'validate booleans',
        config: { oauth: { enabled: 'invalid' } },
        throws: 'oauth.enabled="invalid": Invalid input: expected boolean, received string',
      },
      {
        should: 'validate enums',
        config: { ffmpeg: { transcode: 'unknown' } },
        throws: 'ffmpeg.transcode="unknown": Invalid option: expected one of',
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
          expect(mocks.logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Unknown keys found in file config: '),
          );
        } else {
          const config = await sut.getAdminConfig();
          test.check!(config);
        }
      });
    }
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

    it('should tell every admin', async () => {
      const adminIds = mockAdmins(mocks.user);
      mocks.systemMetadata.get.mockResolvedValue(partialConfig);

      await sut.updateAdminConfig(updatedConfig);

      expectResourceEvents(mocks, { userIds: adminIds, changed: [Resource.adminConfig()] });
    });

    it('rejects a change to a property set by the config file', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      const promise = sut.updateAdminConfig(defaults);

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow('ffmpeg.crf');
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('names every locked property that changed', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({ configFile: 'immich-config.json', configOverrides: { IMMICH_CONFIG_TRASH_DAYS: '10' } }),
      );
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));

      await expect(sut.updateAdminConfig(defaults)).rejects.toThrow(
        'Cannot update properties set by the config file or an environment variable: ffmpeg.crf, trash.days',
      );
    });

    it('rejects a logging change while IMMICH_CONFIG_LOGGING_LEVEL is set', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_LOGGING_LEVEL: 'verbose' } }));
      const config = await sut.getAdminConfig();

      const promise = sut.updateAdminConfig({ ...config, logging: { ...config.logging, level: LogLevel.Debug } });

      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toThrow('logging.level');
      expect(mocks.systemMetadata.set).not.toHaveBeenCalled();
    });

    it('saves other properties while a config file is in use', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));
      const config = await sut.getAdminConfig();

      await sut.updateAdminConfig({ ...config, trash: { ...config.trash, days: 10 } });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.SystemConfig, { trash: { days: 10 } });
    });

    it.each([
      { source: 'the config file', env: { configFile: 'immich-config.json' } },
      { source: 'an environment variable', env: { configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '30' } } },
    ])('keeps a database value shadowed by $source', async ({ env }) => {
      mocks.config.getEnv.mockReturnValue(mockEnvData(env));
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 } });
      mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ ffmpeg: { crf: 30 } }));
      const config = await sut.getAdminConfig();

      await sut.updateAdminConfig({ ...config, trash: { ...config.trash, days: 10 } });

      expect(mocks.systemMetadata.set).toHaveBeenCalledWith(SystemMetadataKey.SystemConfig, {
        ffmpeg: { crf: 25 },
        trash: { days: 10 },
      });
    });
  });

  describe('getAdminConfigFields', () => {
    it('reports a property set by an environment variable as locked', async () => {
      mocks.config.getEnv.mockReturnValue(mockEnvData({ configOverrides: { IMMICH_CONFIG_FFMPEG_CRF: '35' } }));
      mocks.systemMetadata.get.mockResolvedValue({ ffmpeg: { crf: 25 } });

      const fields = await sut.getAdminConfigFields();

      expect(fields.find(({ key }) => key === 'ffmpeg.crf')).toEqual({
        key: 'ffmpeg.crf',
        envName: 'IMMICH_CONFIG_FFMPEG_CRF',
        value: 35,
        sources: [
          { source: ConfigSource.Default, value: 23 },
          { source: ConfigSource.Database, value: 25 },
          { source: ConfigSource.Env, value: 35 },
        ],
        isEditable: false,
      });
    });

    it('reports an untouched property as editable', async () => {
      mocks.systemMetadata.get.mockResolvedValue({});

      const fields = await sut.getAdminConfigFields();

      expect(fields.find(({ key }) => key === 'trash.days')).toEqual({
        key: 'trash.days',
        envName: 'IMMICH_CONFIG_TRASH_DAYS',
        value: 30,
        sources: [{ source: ConfigSource.Default, value: 30 }],
        isEditable: true,
      });
    });
  });

  describe('onBootstrap', () => {
    it('warns about a deprecated environment variable', async () => {
      mocks.config.getEnv.mockReturnValue(
        mockEnvData({
          deprecatedConfigVariables: [{ name: 'IMMICH_LOG_LEVEL', replacement: 'IMMICH_CONFIG_LOGGING_LEVEL' }],
        }),
      );

      await sut.onBootstrap();

      expect(mocks.logger.warn).toHaveBeenCalledWith(
        'IMMICH_LOG_LEVEL is deprecated, use IMMICH_CONFIG_LOGGING_LEVEL instead',
      );
    });

    it('does not warn without deprecated environment variables', async () => {
      await sut.onBootstrap();

      expect(mocks.logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });
  });
});
