import { Expression, RawBuilder, sql, ValueExpression } from 'kysely';
import { InsertObject } from 'node_modules/kysely/dist/cjs';
import { DB } from 'src/db';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

/**
 * Allows optional values unlike the regular Between and uses MoreThanOrEqual
 * or LessThanOrEqual when only one parameter is specified.
 */
export function OptionalBetween<T>(from?: T, to?: T) {
  if (from && to) {
    return Between(from, to);
  } else if (from) {
    return MoreThanOrEqual(from);
  } else if (to) {
    return LessThanOrEqual(to);
  }
}

// populated by the database repository at bootstrap
export const UPSERT_COLUMNS = {} as { [T in keyof DB]: { [K in keyof DB[T]]: RawBuilder<unknown> } };

/** Generates the columns for an upsert statement, excluding the conflict keys.
 * Assumes that all entries have the same keys. */
export function mapUpsertColumns<T extends keyof DB>(
  table: T,
  entry: InsertObject<DB, T>,
  conflictKeys: readonly (keyof DB[T])[],
) {
  const columns = UPSERT_COLUMNS[table] as { [K in keyof DB[T]]: RawBuilder<unknown> };
  const upsertColumns: Partial<Record<keyof typeof entry, RawBuilder<unknown>>> = {};
  for (const entryColumn in entry) {
    if (!conflictKeys.includes(entryColumn as keyof DB[T])) {
      upsertColumns[entryColumn as keyof typeof entry] = columns[entryColumn as keyof DB[T]];
    }
  }

  return upsertColumns as Expand<Record<keyof typeof entry, ValueExpression<DB, T, any>>>;
}

export const asUuid = (id: string | Expression<string>) => sql<string>`${id}::uuid`;

export const anyUuid = (ids: string[]) => sql<string>`any(${`{${ids}}`}::uuid[])`;

export const asVector = (embedding: number[]) => sql<string>`${`[${embedding}]`}::vector`;

/**
 * Mainly for type debugging to make VS Code display a more useful tooltip.
 * Source: https://stackoverflow.com/a/69288824
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/** Recursive version of {@link Expand} from the same source. */
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;
