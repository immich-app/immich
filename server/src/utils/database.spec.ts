import type { KyselyConfig, LogEvent } from 'kysely';
import { getKyselyConfig, getReplicatedKyselyConfig, getSingleInstanceKyselyConfig } from 'src/utils/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const asLogFn = (log: KyselyConfig['log']): ((event: LogEvent) => void | Promise<void>) => {
  if (typeof log !== 'function') {
    throw new TypeError('Expected config.log to be a function');
  }
  return log;
};

const { mockCreatePostgres, mockPostgresJSDialect, mockKyselyReplicationDialect, mockRoundRobinReplicaStrategy } =
  vi.hoisted(() => ({
    mockCreatePostgres: vi.fn((options: any) => ({ kind: 'postgres', options })),
    mockPostgresJSDialect: vi.fn((options: any) => ({ kind: 'PostgresJSDialect', options })),
    mockKyselyReplicationDialect: vi.fn((options: any) => ({ kind: 'KyselyReplicationDialect', options })),
    mockRoundRobinReplicaStrategy: vi.fn((options: any) => ({ kind: 'RoundRobinReplicaStrategy', options })),
  }));

vi.mock('@immich/sql-tools', () => ({ createPostgres: mockCreatePostgres }));
vi.mock('kysely-postgres-js', () => ({ PostgresJSDialect: mockPostgresJSDialect }));
vi.mock('kysely-replication', () => ({ KyselyReplicationDialect: mockKyselyReplicationDialect }));
vi.mock('kysely-replication/strategy/round-robin', () => ({
  RoundRobinReplicaStrategy: mockRoundRobinReplicaStrategy,
}));

const primary = { host: 'primary-host' } as any;
const replicaA = { host: 'replica-a' } as any;
const replicaB = { host: 'replica-b' } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSingleInstanceKyselyConfig', () => {
  it('wraps the connection in a PostgresJSDialect', () => {
    const config = getSingleInstanceKyselyConfig(primary);

    expect(config.dialect).toMatchObject({ kind: 'PostgresJSDialect' });
    expect(mockCreatePostgres).toHaveBeenCalledWith(expect.objectContaining({ connection: primary }));
  });

  it('attaches a log function', () => {
    expect(typeof getSingleInstanceKyselyConfig(primary).log).toBe('function');
  });
});

describe('getReplicatedKyselyConfig', () => {
  it('wraps one primary and N replica dialects in a KyselyReplicationDialect', () => {
    const config = getReplicatedKyselyConfig(primary, [replicaA, replicaB]);
    const { options } = config.dialect as any;

    expect(config.dialect).toMatchObject({ kind: 'KyselyReplicationDialect' });
    expect(options.primaryDialect).toMatchObject({ kind: 'PostgresJSDialect' });
    expect(options.replicaDialects).toHaveLength(2);
    expect(options.replicaDialects[0]).toMatchObject({ kind: 'PostgresJSDialect' });
  });

  it('uses a round-robin strategy that errors on concurrent transactions', () => {
    const config = getReplicatedKyselyConfig(primary, [replicaA]);
    const { options } = config.dialect as any;

    expect(options.replicaStrategy).toMatchObject({
      kind: 'RoundRobinReplicaStrategy',
      options: { onTransaction: 'error' },
    });
  });

  it('opens a postgres connection for the primary and each replica', () => {
    getReplicatedKyselyConfig(primary, [replicaA, replicaB]);

    expect(mockCreatePostgres).toHaveBeenCalledWith(expect.objectContaining({ connection: primary }));
    expect(mockCreatePostgres).toHaveBeenCalledWith(expect.objectContaining({ connection: replicaA }));
    expect(mockCreatePostgres).toHaveBeenCalledWith(expect.objectContaining({ connection: replicaB }));
  });

  it('attaches a log function', () => {
    expect(typeof getReplicatedKyselyConfig(primary, [replicaA]).log).toBe('function');
  });
});

describe('getKyselyConfig', () => {
  it('returns a single-instance config by default', () => {
    expect(getKyselyConfig(primary).dialect).toMatchObject({ kind: 'PostgresJSDialect' });
  });

  it('returns a single-instance config when enableReplicas is false', () => {
    expect(getKyselyConfig(primary, false).dialect).toMatchObject({ kind: 'PostgresJSDialect' });
  });

  it('throws when enableReplicas is true but no replicas are given', () => {
    expect(() => getKyselyConfig(primary, true)).toThrow('enableReplicas is true but no replicas were configured');
  });

  it('returns a replicated config when replicas are given', () => {
    const config = getKyselyConfig(primary, true, [replicaA, replicaB]);
    expect(config.dialect).toMatchObject({ kind: 'KyselyReplicationDialect' });
  });
});

describe('query logger', () => {
  it('logs query errors to the console', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = asLogFn(getSingleInstanceKyselyConfig(primary).log);

    await log({
      level: 'error',
      error: new Error('boom'),
      queryDurationMillis: 12,
      query: { query: 'select 1', queryId: 'q1', parameters: [] } as any,
    });

    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('suppresses asset checksum constraint violations', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = asLogFn(getSingleInstanceKyselyConfig(primary).log);

    await log({
      level: 'error',
      error: { constraint_name: 'UQ_assets_owner_checksum' },
      queryDurationMillis: 12,
      query: { query: 'insert into asset ...', queryId: 'q1', parameters: [] } as any,
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('ignores non-error events', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = asLogFn(getSingleInstanceKyselyConfig(primary).log);

    await log({
      level: 'query',
      queryDurationMillis: 12,
      query: { query: 'select 1', queryId: 'q1', parameters: [] } as any,
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('notice handling', () => {
  it('labels notices by connection role', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getReplicatedKyselyConfig(primary, [replicaA]);

    const [primaryOptions] = mockCreatePostgres.mock.calls.find((call) => call[0].connection === primary)!;
    const [replicaOptions] = mockCreatePostgres.mock.calls.find((call) => call[0].connection === replicaA)!;

    primaryOptions.onNotice({ severity: 'WARNING', message: 'careful' });
    replicaOptions.onNotice({ severity: 'WARNING', message: 'careful' });

    expect(consoleWarn).toHaveBeenNthCalledWith(
      1,
      'Primary Postgres notice:',
      expect.objectContaining({ severity: 'WARNING' }),
    );
    expect(consoleWarn).toHaveBeenNthCalledWith(
      2,
      'Replica Postgres notice:',
      expect.objectContaining({ severity: 'WARNING' }),
    );
    consoleWarn.mockRestore();
  });

  it('ignores plain NOTICE severity', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getSingleInstanceKyselyConfig(primary);

    const [options] = mockCreatePostgres.mock.calls[0];
    options.onNotice({ severity: 'NOTICE', message: 'fyi' });

    expect(consoleWarn).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
