import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOperationOptions, ApiProperty, ApiPropertyOptions, ApiTags } from '@nestjs/swagger';
import _ from 'lodash';
import { ApiCustomExtension, ApiTag, ImmichWorker, JobName, MetadataKey, QueueName } from 'src/enum';
import { EmitEvent } from 'src/repositories/event.repository';
import { immich_uuid_v7, updated_at } from 'src/schema/functions';
import { BeforeUpdateTrigger, Column, ColumnOptions } from 'src/sql-tools';
import { setUnion } from 'src/utils/set';

const GeneratedUuidV7Column = (options: Omit<ColumnOptions, 'type' | 'default' | 'nullable'> = {}) =>
  Column({ ...options, type: 'uuid', nullable: false, default: () => `${immich_uuid_v7.name}()` });

export const UpdateIdColumn = (options: Omit<ColumnOptions, 'type' | 'default' | 'nullable'> = {}) =>
  GeneratedUuidV7Column(options);

export const CreateIdColumn = (options: Omit<ColumnOptions, 'type' | 'default' | 'nullable'> = {}) =>
  GeneratedUuidV7Column(options);

export const PrimaryGeneratedUuidV7Column = () => GeneratedUuidV7Column({ primary: true });

export const UpdatedAtTrigger = (name: string) =>
  BeforeUpdateTrigger({
    name,
    scope: 'row',
    function: updated_at,
  });

// PostgreSQL uses a 16-bit integer to indicate the number of bound parameters. This means that the
// maximum number of parameters is 65535. Any query that tries to bind more than that (e.g. searching
// by a list of IDs) requires splitting the query into multiple chunks.
// We are rounding down this limit, as queries commonly include other filters and parameters.
export const DATABASE_PARAMETER_CHUNK_SIZE = 65_500;

/**
 * Chunks an array or set into smaller collections of the same type and specified size.
 *
 * @param collection The collection to chunk.
 * @param size The size of each chunk.
 */
function chunks<T>(collection: Array<T>, size: number): Array<Array<T>>;
function chunks<T>(collection: Set<T>, size: number): Array<Set<T>>;
function chunks<T>(collection: Array<T> | Set<T>, size: number): Array<Array<T>> | Array<Set<T>> {
  if (collection instanceof Set) {
    const result = [];
    let chunk = new Set<T>();
    for (const element of collection) {
      chunk.add(element);
      if (chunk.size === size) {
        result.push(chunk);
        chunk = new Set<T>();
      }
    }
    if (chunk.size > 0) {
      result.push(chunk);
    }
    return result;
  } else {
    return _.chunk(collection, size);
  }
}

/**
 * Wraps a method that takes a collection of parameters and sequentially calls it with chunks of the collection,
 * to overcome the maximum number of parameters allowed by the database driver.
 *
 * @param options.paramIndex The index of the function parameter to chunk. Defaults to 0.
 * @param options.flatten Whether to flatten the results. Defaults to false.
 */
export function Chunked(
  options: { paramIndex?: number; chunkSize?: number; mergeFn?: (results: any) => any } = {},
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const parameterIndex = options.paramIndex ?? 0;
    const chunkSize = options.chunkSize || DATABASE_PARAMETER_CHUNK_SIZE;
    descriptor.value = async function (...arguments_: any[]) {
      const argument = arguments_[parameterIndex];

      // Early return if argument length is less than or equal to the chunk size.
      if (
        (Array.isArray(argument) && argument.length <= chunkSize) ||
        (argument instanceof Set && argument.size <= chunkSize)
      ) {
        return await originalMethod.apply(this, arguments_);
      }

      return Promise.all(
        chunks(argument, chunkSize).map(async (chunk) => {
          return await Reflect.apply(originalMethod, this, [
            ...arguments_.slice(0, parameterIndex),
            chunk,
            ...arguments_.slice(parameterIndex + 1),
          ]);
        }),
      ).then((results) => (options.mergeFn ? options.mergeFn(results) : results));
    };
  };
}

export function ChunkedArray(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: _.flatten });
}

export function ChunkedSet(options?: { paramIndex?: number }): MethodDecorator {
  return Chunked({ ...options, mergeFn: (args: Set<any>[]) => setUnion(...args) });
}

const UUID = '00000000-0000-4000-a000-000000000000';

export const DummyValue = {
  UUID,
  UUID_SET: new Set([UUID]),
  PAGINATION: { take: 10, skip: 0 },
  EMAIL: 'user@immich.app',
  STRING: 'abcdefghi',
  NUMBER: 50,
  BUFFER: Buffer.from('abcdefghi'),
  DATE: new Date(),
  TIME_BUCKET: '2024-01-01T00:00:00.000Z',
  BOOLEAN: true,
  VECTOR: JSON.stringify(Array.from({ length: 512 }, () => 0)),
};

export const GENERATE_SQL_KEY = 'generate-sql-key';

export interface GenerateSqlQueries {
  name?: string;
  params: unknown[];
  stream?: boolean;
}

export const Telemetry = (options: { enabled?: boolean }) =>
  SetMetadata(MetadataKey.TelemetryEnabled, options?.enabled ?? true);

/** Decorator to enable versioning/tracking of generated Sql */
export const GenerateSql = (...options: GenerateSqlQueries[]) => SetMetadata(GENERATE_SQL_KEY, options);

export type EventConfig = {
  name: EmitEvent;
  /** handle socket.io server events as well  */
  server?: boolean;
  /** lower value has higher priority, defaults to 0 */
  priority?: number;
  /** register events for these workers, defaults to all workers */
  workers?: ImmichWorker[];
};
export const OnEvent = (config: EventConfig) => SetMetadata(MetadataKey.EventConfig, config);

export type JobConfig = {
  name: JobName;
  queue: QueueName;
};
export const OnJob = (config: JobConfig) => SetMetadata(MetadataKey.JobConfig, config);

type EndpointOptions = ApiOperationOptions & { history?: HistoryBuilder };
export const Endpoint = ({ history, ...options }: EndpointOptions) => {
  const decorators: MethodDecorator[] = [];
  const extensions = history?.getExtensions() ?? {};

  if (!extensions[ApiCustomExtension.History]) {
    console.log(`Missing history for endpoint: ${options.summary}`);
  }

  if (history?.isDeprecated()) {
    options.deprecated = true;
    decorators.push(ApiTags(ApiTag.Deprecated));
  }

  decorators.push(ApiOperation({ ...options, ...extensions }));

  return applyDecorators(...decorators);
};

type PropertyOptions = ApiPropertyOptions & { history?: HistoryBuilder };
export const Property = ({ history, ...options }: PropertyOptions) => {
  const extensions = history?.getExtensions() ?? {};

  if (history?.isDeprecated()) {
    options.deprecated = true;
  }

  return ApiProperty({ ...options, ...extensions });
};

type HistoryEntry = {
  version: string;
  state: ApiState | 'Added' | 'Updated';
  description?: string;
  replacementId?: string;
};

type DeprecatedOptions = {
  /** replacement operationId */
  replacementId?: string;
};

type CustomExtensions = {
  [ApiCustomExtension.State]?: ApiState;
  [ApiCustomExtension.History]?: HistoryEntry[];
};

enum ApiState {
  'Stable' = 'Stable',
  'Alpha' = 'Alpha',
  'Beta' = 'Beta',
  'Internal' = 'Internal',
  'Deprecated' = 'Deprecated',
}
export class HistoryBuilder {
  private hasDeprecated = false;
  private items: HistoryEntry[] = [];

  added(version: string, description?: string) {
    return this.push({ version, state: 'Added', description });
  }

  updated(version: string, description: string) {
    return this.push({ version, state: 'Updated', description });
  }

  alpha(version: string) {
    return this.push({ version, state: ApiState.Alpha });
  }

  beta(version: string) {
    return this.push({ version, state: ApiState.Beta });
  }

  internal(version: string) {
    return this.push({ version, state: ApiState.Internal });
  }

  stable(version: string) {
    return this.push({ version, state: ApiState.Stable });
  }

  deprecated(version: string, options?: DeprecatedOptions) {
    const { replacementId } = options || {};
    this.hasDeprecated = true;
    return this.push({ version, state: ApiState.Deprecated, replacementId });
  }

  isDeprecated(): boolean {
    return this.hasDeprecated;
  }

  getExtensions() {
    const extensions: CustomExtensions = {};

    if (this.items.length > 0) {
      extensions[ApiCustomExtension.History] = this.items;
    }

    for (const item of this.items.toReversed()) {
      if (item.state === 'Added' || item.state === 'Updated') {
        continue;
      }

      extensions[ApiCustomExtension.State] = item.state;
      break;
    }

    return extensions;
  }

  private push(item: HistoryEntry) {
    if (!item.version.startsWith('v')) {
      throw new Error(`Version string must start with 'v': received '${JSON.stringify(item)}'`);
    }
    this.items.push(item);
    return this;
  }
}
