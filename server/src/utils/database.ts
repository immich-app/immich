import { Expression, Kysely, RawBuilder, sql } from 'kysely';
import { InsertObject } from 'node_modules/kysely/dist/cjs';
import { DB } from 'src/db';
import { Between, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

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

const UPSERT_COLUMNS = {} as { [T in keyof DB]: { [K in keyof DB[T]]: RawBuilder<string> } };
export const introspectUpsertColumns = (dataSource: DataSource, ...tables: (keyof DB)[]) => {
  for (const table of tables) {
    if (table in UPSERT_COLUMNS) {
      continue;
    }

    const metadata = dataSource.manager.connection.getMetadata(table);
    UPSERT_COLUMNS[table] = Object.fromEntries(
      metadata.ownColumns.map((column) => [column.propertyName, sql<string>`excluded.${sql.ref(column.propertyName)}`]),
    ) as any;
  }
};

const mapUpsertColumns = <T extends keyof DB>(
  columns: { [K in keyof DB[T]]: RawBuilder<string> },
  entries: InsertObject<DB, T>[],
  conflictKeys: (keyof DB[T])[],
) => {
  const entry = entries[0];
  const upsertColumns: Partial<Record<keyof typeof entry, RawBuilder<string>>> = {};
  for (const entryColumn in entry) {
    if (!conflictKeys.includes(entryColumn as keyof DB[T])) {
      upsertColumns[entryColumn as keyof typeof entry] = columns[entryColumn as keyof DB[T]];
    }
  }

  return upsertColumns as Expand<Record<keyof typeof entry, RawBuilder<string>>>;
};

export const upsertHelper = <T extends keyof DB>(
  db: Kysely<DB>,
  table: T,
  values: InsertObject<DB, T>[],
  conflictKeys: (string & keyof DB[T])[],
) => {
  return db
    .insertInto(table)
    .values(values)
    .onConflict((oc) =>
      oc.columns(conflictKeys).doUpdateSet(() => mapUpsertColumns(UPSERT_COLUMNS[table], values, conflictKeys)),
    );
};

export const asUuid = (id: string | Expression<string>) => sql<string>`${id}::uuid`;

export const anyUuid = (ids: string[]) => sql<string>`any(${`{${ids}}`}::uuid[])`;

export const asVector = (embedding: number[]) => sql<number[]>`${`[${embedding}]`}::vector`;

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
