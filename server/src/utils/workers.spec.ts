import { getWorkers } from 'src/utils/workers';

describe('getWorkers', () => {
  beforeEach(() => {
    process.env.IMMICH_WORKERS_INCLUDE = '';
    process.env.IMMICH_WORKERS_EXCLUDE = '';
  });

  it('should return default workers', () => {
    expect(getWorkers()).toEqual(['api', 'microservices']);
  });

  it('should return included workers', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api';
    expect(getWorkers()).toEqual(['api']);
  });

  it('should excluded workers from defaults', () => {
    process.env.IMMICH_WORKERS_EXCLUDE = 'api';
    expect(getWorkers()).toEqual(['microservices']);
  });

  it('should exclude workers from include list', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
    process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices';
    expect(getWorkers()).toEqual(['api']);
  });

  it('should remove whitespace from included workers before parsing', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices';
    expect(getWorkers()).toEqual(['api', 'microservices']);
  });

  it('should remove whitespace from excluded workers before parsing', () => {
    process.env.IMMICH_WORKERS_EXCLUDE = 'api, microservices';
    expect(getWorkers()).toEqual([]);
  });

  it('should remove whitespace from included and excluded workers before parsing', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices, randomservice,randomservice2';
    process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices, randomservice2';
    expect(getWorkers()).toEqual(['api']);
  });

  it('should throw error for invalid workers', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
    expect(getWorkers).toThrowError('Invalid worker(s) found: api,microservices,randomservice');
  });
});
