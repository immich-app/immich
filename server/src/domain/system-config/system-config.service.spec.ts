import {
  AudioCodec,
  Colorspace,
  CQMode,
  LogLevel,
  SystemConfig,
  SystemConfigEntity,
  SystemConfigKey,
  ToneMapping,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException } from '@nestjs/common';
import { newCommunicationRepositoryMock, newSystemConfigRepositoryMock } from '@test';
import { QueueName } from '../job';
import { ICommunicationRepository, ISmartInfoRepository, ISystemConfigRepository, ServerEvent } from '../repositories';
import { defaults, SystemConfigValidator } from './system-config.core';
import { SystemConfigService } from './system-config.service';

const updates: SystemConfigEntity[] = [
  { key: SystemConfigKey.FFMPEG_CRF, value: 30 },
  { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: true },
  { key: SystemConfigKey.TRASH_DAYS, value: 10 },
];

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
  },
  ffmpeg: {
    crf: 30,
    threads: 0,
    preset: 'ultrafast',
    targetAudioCodec: AudioCodec.AAC,
    acceptedAudioCodecs: [AudioCodec.AAC],
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
    facialRecognition: {
      enabled: true,
      modelName: 'buffalo_l',
      minScore: 0.7,
      maxDistance: 0.6,
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
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    storageLabelClaim: 'preferred_username',
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
  thumbnail: {
    webpSize: 250,
    jpegSize: 1440,
    quality: 80,
    colorspace: Colorspace.P3,
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
      usePolling: false,
      interval: 10_000,
    },
  },
});

describe(SystemConfigService.name, () => {
  let sut: SystemConfigService;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let communicationMock: jest.Mocked<ICommunicationRepository>;
  let smartInfoMock: jest.Mocked<ISmartInfoRepository>;

  beforeEach(async () => {
    delete process.env.IMMICH_CONFIG_FILE;
    configMock = newSystemConfigRepositoryMock();
    communicationMock = newCommunicationRepositoryMock();
    sut = new SystemConfigService(configMock, communicationMock, smartInfoMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDefaults', () => {
    it('should return the default config', () => {
      configMock.load.mockResolvedValue(updates);

      expect(sut.getDefaults()).toEqual(defaults);
      expect(configMock.load).not.toHaveBeenCalled();
    });
  });

  describe('addValidator', () => {
    it('should call the validator on config changes', async () => {
      const validator: SystemConfigValidator = jest.fn();
      sut.addValidator(validator);
      await sut.updateConfig(defaults);
      expect(validator).toHaveBeenCalledWith(defaults, defaults);
    });
  });

  describe('getConfig', () => {
    let warnLog: jest.SpyInstance;

    beforeEach(() => {
      warnLog = jest.spyOn(ImmichLogger.prototype, 'warn');
    });

    afterEach(() => {
      warnLog.mockRestore();
    });

    it('should return the default config', async () => {
      configMock.load.mockResolvedValue([]);

      await expect(sut.getConfig()).resolves.toEqual(defaults);
    });

    it('should merge the overrides', async () => {
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_CRF, value: 30 },
        { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: true },
        { key: SystemConfigKey.TRASH_DAYS, value: 10 },
      ]);

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);
    });

    it('should load the config from a file', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      const partialConfig = { ffmpeg: { crf: 30 }, oauth: { autoLaunch: true }, trash: { days: 10 } };
      configMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);

      expect(configMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should accept an empty configuration file', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      configMock.readFile.mockResolvedValue(JSON.stringify({}));

      await expect(sut.getConfig()).resolves.toEqual(defaults);

      expect(configMock.readFile).toHaveBeenCalledWith('immich-config.json');
    });

    it('should allow underscores in the machine learning url', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      const partialConfig = { machineLearning: { url: 'immich_machine_learning' } };
      configMock.readFile.mockResolvedValue(JSON.stringify(partialConfig));

      const config = await sut.getConfig();
      expect(config.machineLearning.url).toEqual('immich_machine_learning');
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
        configMock.readFile.mockResolvedValue(JSON.stringify(test.config));

        if (test.warn) {
          await sut.getConfig();
          expect(warnLog).toHaveBeenCalled();
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
        secondOptions: ['s', 'ss'],
        weekOptions: ['W', 'WW'],
        yearOptions: ['y', 'yy'],
      });
    });
  });

  describe('updateConfig', () => {
    it('should update the config and emit client and server events', async () => {
      configMock.load.mockResolvedValue(updates);

      await expect(sut.updateConfig(updatedConfig)).resolves.toEqual(updatedConfig);

      expect(communicationMock.broadcast).toHaveBeenCalled();
      expect(communicationMock.sendServerEvent).toHaveBeenCalledWith(ServerEvent.CONFIG_UPDATE);
      expect(configMock.saveAll).toHaveBeenCalledWith(updates);
    });

    it('should throw an error if the config is not valid', async () => {
      const validator = jest.fn().mockRejectedValue('invalid config');

      sut.addValidator(validator);

      await expect(sut.updateConfig(updatedConfig)).rejects.toBeInstanceOf(BadRequestException);

      expect(validator).toHaveBeenCalledWith(updatedConfig, defaults);
      expect(configMock.saveAll).not.toHaveBeenCalled();
    });

    it('should throw an error if a config file is in use', async () => {
      process.env.IMMICH_CONFIG_FILE = 'immich-config.json';
      configMock.readFile.mockResolvedValue(JSON.stringify({}));
      await expect(sut.updateConfig(defaults)).rejects.toBeInstanceOf(BadRequestException);
      expect(configMock.saveAll).not.toHaveBeenCalled();
    });
  });

  describe('refreshConfig', () => {
    it('should notify the subscribers', async () => {
      const changeMock = jest.fn();
      const subscription = sut.config$.subscribe(changeMock);

      await sut.refreshConfig();

      expect(changeMock).toHaveBeenCalledWith(defaults);

      subscription.unsubscribe();
    });
  });

  describe('getCustomCss', () => {
    it('should return the default theme', async () => {
      await expect(sut.getCustomCss()).resolves.toEqual(defaults.theme.customCss);
    });
  });
});
