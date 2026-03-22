import { Migration } from 'kysely';
import { CompositeMigrationProvider } from 'src/schema/composite-migration-provider';

// Mock FileMigrationProvider to avoid filesystem access
vi.mock('kysely', async () => {
  const actual = await vi.importActual('kysely');
  return {
    ...actual,
    FileMigrationProvider: vi.fn(),
  };
});

import { FileMigrationProvider } from 'kysely';

const mockMigration = (name: string): Migration => ({
  up: vi.fn().mockResolvedValue(undefined),
  down: vi.fn().mockResolvedValue(undefined),
});

const setupMockProviders = (folders: Record<string, Record<string, Migration>>) => {
  const MockFMP = vi.mocked(FileMigrationProvider);
  MockFMP.mockReset();
  const folderList = Object.keys(folders);
  let callIndex = 0;
  MockFMP.mockImplementation(() => {
    const folder = folderList[callIndex++];
    return {
      getMigrations: vi.fn().mockResolvedValue(folders[folder] ?? {}),
    } as any;
  });
};

describe('CompositeMigrationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Merges migrations from two folders
  it('should merge migrations from multiple folders into a single record', async () => {
    const upstreamMigrations = {
      '1744910873969-InitialMigration': mockMigration('initial'),
      '1772609167000-UpdateOpusCodecName': mockMigration('opus'),
    };
    const forkMigrations = {
      '1772230000000-CreateStorageMigrationLogTable': mockMigration('storage'),
      '1772240000000-CreateSharedSpaceTables': mockMigration('spaces'),
    };
    setupMockProviders({ upstream: upstreamMigrations, fork: forkMigrations });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(4);
    expect(result).toHaveProperty('1744910873969-InitialMigration');
    expect(result).toHaveProperty('1772609167000-UpdateOpusCodecName');
    expect(result).toHaveProperty('1772230000000-CreateStorageMigrationLogTable');
    expect(result).toHaveProperty('1772240000000-CreateSharedSpaceTables');
  });

  // Test 2: Empty fork folder
  it('should handle empty fork folder', async () => {
    const upstreamMigrations = {
      '1744910873969-InitialMigration': mockMigration('initial'),
    };
    setupMockProviders({ upstream: upstreamMigrations, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('1744910873969-InitialMigration');
  });

  // Test 3: Empty upstream folder
  it('should handle empty upstream folder', async () => {
    const forkMigrations = {
      '1772230000000-CreateStorageMigrationLogTable': mockMigration('storage'),
    };
    setupMockProviders({ upstream: {}, fork: forkMigrations });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result).toHaveProperty('1772230000000-CreateStorageMigrationLogTable');
  });

  // Test 4: Both folders empty
  it('should handle both folders empty', async () => {
    setupMockProviders({ upstream: {}, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(0);
  });

  // Test 5: Duplicate migration name — last folder wins
  it('should use the last folder migration when names collide', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const upstreamVersion = mockMigration('upstream-version');
    const forkVersion = mockMigration('fork-version');
    setupMockProviders({
      upstream: { 'same-name': upstreamVersion },
      fork: { 'same-name': forkVersion },
    });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['same-name']).toBe(forkVersion);
    consoleSpy.mockRestore();
  });

  // Test 6: Migration functions are callable
  it('should return migrations with callable up and down functions', async () => {
    const migration = mockMigration('test');
    setupMockProviders({ upstream: { 'test-migration': migration }, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(result['test-migration'].up).toBeTypeOf('function');
    expect(result['test-migration'].down).toBeTypeOf('function');
  });

  // Test 7 (design #13): Interleaved timestamps merge correctly
  it('should merge interleaved timestamps from both folders', async () => {
    const upstream = {
      '100-first': mockMigration('1'),
      '300-third': mockMigration('3'),
      '500-fifth': mockMigration('5'),
    };
    const fork = {
      '200-second': mockMigration('2'),
      '400-fourth': mockMigration('4'),
    };
    setupMockProviders({ upstream, fork });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(5);
    const sorted = Object.keys(result).sort();
    expect(sorted).toEqual(['100-first', '200-second', '300-third', '400-fourth', '500-fifth']);
  });

  // Test 8 (design #14): Folder doesn't exist — propagates error
  it('should propagate error when a folder does not exist', async () => {
    const MockFMP = vi.mocked(FileMigrationProvider);
    MockFMP.mockImplementation(() => {
      return {
        getMigrations: vi.fn().mockRejectedValue(new Error('ENOENT: no such file or directory')),
      } as any;
    });

    const provider = new CompositeMigrationProvider(['nonexistent']);
    await expect(provider.getMigrations()).rejects.toThrow('ENOENT');
  });

  // Test 9 (design #15): Provider error propagation
  it('should propagate provider errors from individual folders', async () => {
    const MockFMP = vi.mocked(FileMigrationProvider);
    let callIndex = 0;
    MockFMP.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return {
          getMigrations: vi.fn().mockResolvedValue({ 'good-migration': mockMigration('good') }),
        } as any;
      }
      return {
        getMigrations: vi.fn().mockRejectedValue(new Error('Cannot find module ./bad-migration')),
      } as any;
    });

    const provider = new CompositeMigrationProvider(['good-folder', 'bad-folder']);
    await expect(provider.getMigrations()).rejects.toThrow('Cannot find module');
  });

  // Test 10 (design #18): Duplicate timestamps produce only one entry
  it('should silently overwrite when two migrations share the same key', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = mockMigration('first');
    const second = mockMigration('second');
    setupMockProviders({
      upstream: { '1772810000000-AddSharedSpaceActivityTable': first },
      fork: { '1772810000000-AddSharedSpaceActivityTable': second },
    });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['1772810000000-AddSharedSpaceActivityTable']).toBe(second);
    consoleSpy.mockRestore();
  });

  // Test 11 (design #23): Single folder
  it('should work with a single folder', async () => {
    setupMockProviders({ only: {} });

    const provider = new CompositeMigrationProvider(['only']);
    const result = await provider.getMigrations();

    expect(Object.keys(result)).toHaveLength(0);
  });

  // Test 12: Migration without down function
  it('should handle migrations without a down function', async () => {
    const upOnly: Migration = { up: vi.fn().mockResolvedValue(undefined) };
    setupMockProviders({ upstream: { 'up-only': upOnly }, fork: {} });

    const provider = new CompositeMigrationProvider(['upstream', 'fork']);
    const result = await provider.getMigrations();

    expect(result['up-only'].up).toBeTypeOf('function');
    expect(result['up-only'].down).toBeUndefined();
  });
});
