import { newJobRepositoryMock, newSystemConfigRepositoryMock } from '../../test';
import { IJobRepository } from '../job';
import { ISystemConfigRepository } from './system-config.repository';
import { SystemConfigService } from './system-config.service';

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
        ],
        secondOptions: ['s', 'ss'],
        yearOptions: ['y', 'yy'],
      });
    });
  });
});
