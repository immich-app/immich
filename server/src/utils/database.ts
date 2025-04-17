import {
  Expression,
  ExpressionBuilder,
  ExpressionWrapper,
  KyselyConfig,
  Nullable,
  Selectable,
  Simplify,
  sql,
} from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres, { Notice } from 'postgres';

type Ssl = 'require' | 'allow' | 'prefer' | 'verify-full' | boolean | object;

export type PostgresConnectionConfig = {
  host?: string;
  password?: string;
  user?: string;
  port?: number;
  database?: string;
  max?: number;
  client_encoding?: string;
  ssl?: Ssl;
  application_name?: string;
  fallback_application_name?: string;
  options?: string;
};

export const isValidSsl = (ssl?: string | boolean | object): ssl is Ssl =>
  typeof ssl !== 'string' || ssl === 'require' || ssl === 'allow' || ssl === 'prefer' || ssl === 'verify-full';

export const getKyselyConfig = (options: PostgresConnectionConfig): KyselyConfig => {
  return {
    dialect: new PostgresJSDialect({
      postgres: postgres({
        onnotice: (notice: Notice) => {
          if (notice['severity'] !== 'NOTICE') {
            console.warn('Postgres notice:', notice);
          }
        },
        max: 10,
        types: {
          date: {
            to: 1184,
            from: [1082, 1114, 1184],
            serialize: (x: Date | string) => (x instanceof Date ? x.toISOString() : x),
            parse: (x: string) => new Date(x),
          },
          bigint: {
            to: 20,
            from: [20, 1700],
            parse: (value: string) => Number.parseInt(value),
            serialize: (value: number) => value.toString(),
          },
        },
        connection: {
          TimeZone: 'UTC',
        },
        ...options,
      }),
    }),
    log(event) {
      if (event.level === 'error') {
        console.error('Query failed :', {
          durationMs: event.queryDurationMillis,
          error: event.error,
          sql: event.query.sql,
          params: event.query.parameters,
        });
      }
    },
  };
};

export const asUuid = (id: string | Expression<string>) => sql<string>`${id}::uuid`;

export const anyUuid = (ids: string[]) => sql<string>`any(${`{${ids}}`}::uuid[])`;

export const asVector = (embedding: number[]) => sql<string>`${`[${embedding}]`}::vector`;

export const unnest = (array: string[]) => sql<Record<string, string>>`unnest(array[${sql.join(array)}]::text[])`;

export const removeUndefinedKeys = <T extends object>(update: T, template: unknown) => {
  for (const key in update) {
    if ((template as T)[key] === undefined) {
      delete update[key];
    }
  }

  return update;
};

/** Modifies toJson return type to not set all properties as nullable */
export function toJson<DB, TB extends keyof DB & string, T extends TB | Expression<unknown>>(
  eb: ExpressionBuilder<DB, TB>,
  table: T,
) {
  return eb.fn.toJson<T>(table) as ExpressionWrapper<
    DB,
    TB,
    Simplify<
      T extends TB
        ? Selectable<DB[T]> extends Nullable<infer N>
          ? N | null
          : Selectable<DB[T]>
        : T extends Expression<infer O>
          ? O extends Nullable<infer N>
            ? N | null
            : O
          : never
    >
  >;
}
