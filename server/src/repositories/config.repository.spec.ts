import { ConfigRepository } from 'src/repositories/config.repository';

const getEnv = () => new ConfigRepository().getEnv();

describe('getEnv', () => {
  beforeEach(() => {
    delete process.env.IMMICH_WORKERS_INCLUDE;
    delete process.env.IMMICH_WORKERS_EXCLUDE;
    delete process.env.NO_COLOR;
  });

  it('should return default workers', () => {
    const { workers } = getEnv();
    expect(workers).toEqual(['api', 'microservices']);
  });

  it('should return included workers', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api';
    const { workers } = getEnv();
    expect(workers).toEqual(['api']);
  });

  it('should excluded workers from defaults', () => {
    process.env.IMMICH_WORKERS_EXCLUDE = 'api';
    const { workers } = getEnv();
    expect(workers).toEqual(['microservices']);
  });

  it('should exclude workers from include list', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
    process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices';
    const { workers } = getEnv();
    expect(workers).toEqual(['api']);
  });

  it('should remove whitespace from included workers before parsing', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices';
    const { workers } = getEnv();
    expect(workers).toEqual(['api', 'microservices']);
  });

  it('should remove whitespace from excluded workers before parsing', () => {
    process.env.IMMICH_WORKERS_EXCLUDE = 'api, microservices';
    const { workers } = getEnv();
    expect(workers).toEqual([]);
  });

  it('should remove whitespace from included and excluded workers before parsing', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api, microservices, randomservice,randomservice2';
    process.env.IMMICH_WORKERS_EXCLUDE = 'randomservice,microservices, randomservice2';
    const { workers } = getEnv();
    expect(workers).toEqual(['api']);
  });

  it('should throw error for invalid workers', () => {
    process.env.IMMICH_WORKERS_INCLUDE = 'api,microservices,randomservice';
    expect(getEnv).toThrowError('Invalid worker(s) found: api,microservices,randomservice');
  });

  it('should default noColor to false', () => {
    const { noColor } = getEnv();
    expect(noColor).toBe(false);
  });

  it('should map NO_COLOR=1 to true', () => {
    process.env.NO_COLOR = '1';
    const { noColor } = getEnv();
    expect(noColor).toBe(true);
  });

  it('should map NO_COLOR=true to true', () => {
    process.env.NO_COLOR = 'true';
    const { noColor } = getEnv();
    expect(noColor).toBe(true);
  });
});
