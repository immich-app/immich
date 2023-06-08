import { SystemConfig, SystemConfigEntity, SystemConfigKey, TranscodePreset } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import { newJobRepositoryMock, newSystemConfigRepositoryMock, systemConfigStub } from '@test';
import { IJobRepository, JobName, QueueName } from '../job';
import { SystemConfigValidator } from './system-config.core';
import { ISystemConfigRepository } from './system-config.repository';
import { SystemConfigService } from './system-config.service';

const updates: SystemConfigEntity[] = [
  { key: SystemConfigKey.FFMPEG_CRF, value: 30 },
  { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: true },
];

const updatedConfig = Object.freeze<SystemConfig>({
  job: {
    [QueueName.BACKGROUND_TASK]: { concurrency: 5 },
    [QueueName.CLIP_ENCODING]: { concurrency: 2 },
    [QueueName.METADATA_EXTRACTION]: { concurrency: 5 },
    [QueueName.OBJECT_TAGGING]: { concurrency: 2 },
    [QueueName.RECOGNIZE_FACES]: { concurrency: 2 },
    [QueueName.SEARCH]: { concurrency: 5 },
    [QueueName.SIDECAR]: { concurrency: 5 },
    [QueueName.STORAGE_TEMPLATE_MIGRATION]: { concurrency: 5 },
    [QueueName.THUMBNAIL_GENERATION]: { concurrency: 5 },
    [QueueName.VIDEO_CONVERSION]: { concurrency: 1 },
  },
  ffmpeg: {
    crf: 30,
    threads: 0,
    preset: 'ultrafast',
    targetAudioCodec: 'aac',
    targetResolution: '720',
    targetVideoCodec: 'h264',
    maxBitrate: '0',
    twoPass: false,
    transcode: TranscodePreset.REQUIRED,
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
  },
  passwordLogin: {
    enabled: true,
  },
  storageTemplate: {
    template: '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
  },
});

describe(SystemConfigService.name, () => {
  let sut: SystemConfigService;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  beforeEach(async () => {
    configMock = newSystemConfigRepositoryMock();
    jobMock = newJobRepositoryMock();
    sut = new SystemConfigService(configMock, jobMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDefaults', () => {
    it('should return the default config', () => {
      configMock.load.mockResolvedValue(updates);

      expect(sut.getDefaults()).toEqual(systemConfigStub.defaults);
      expect(configMock.load).not.toHaveBeenCalled();
    });
  });

  describe('addValidator', () => {
    it('should call the validator on config changes', async () => {
      const validator: SystemConfigValidator = jest.fn();

      sut.addValidator(validator);

      await sut.updateConfig(systemConfigStub.defaults);

      expect(validator).toHaveBeenCalledWith(systemConfigStub.defaults);
    });
  });

  describe('getConfig', () => {
    it('should return the default config', async () => {
      configMock.load.mockResolvedValue([]);

      await expect(sut.getConfig()).resolves.toEqual(systemConfigStub.defaults);
    });

    it('should merge the overrides', async () => {
      configMock.load.mockResolvedValue([
        { key: SystemConfigKey.FFMPEG_CRF, value: 30 },
        { key: SystemConfigKey.OAUTH_AUTO_LAUNCH, value: true },
      ]);

      await expect(sut.getConfig()).resolves.toEqual(updatedConfig);
    });
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
        ],
        secondOptions: ['s', 'ss'],
        yearOptions: ['y', 'yy'],
      });
    });
  });

  describe('updateConfig', () => {
    it('should notify the microservices process', async () => {
      configMock.load.mockResolvedValue(updates);

      await expect(sut.updateConfig(updatedConfig)).resolves.toEqual(updatedConfig);

      expect(configMock.saveAll).toHaveBeenCalledWith(updates);
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.SYSTEM_CONFIG_CHANGE });
    });

    it('should throw an error if the config is not valid', async () => {
      const validator = jest.fn().mockRejectedValue('invalid config');

      sut.addValidator(validator);

      await expect(sut.updateConfig(updatedConfig)).rejects.toBeInstanceOf(BadRequestException);

      expect(validator).toHaveBeenCalledWith(updatedConfig);
      expect(configMock.saveAll).not.toHaveBeenCalled();
    });
  });

  describe('refreshConfig', () => {
    it('should notify the subscribers', async () => {
      const changeMock = jest.fn();
      const subscription = sut.config$.subscribe(changeMock);

      await sut.refreshConfig();

      expect(changeMock).toHaveBeenCalledWith(systemConfigStub.defaults);

      subscription.unsubscribe();
    });
  });
});
