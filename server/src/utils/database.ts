import { Expression, Kysely, RawBuilder, sql, TableMetadata, ValueExpression } from 'kysely';
import { InsertObject } from 'node_modules/kysely/dist/cjs';
import { InsertObjectOrList } from 'node_modules/kysely/dist/cjs/parser/insert-values-parser';
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

const UPSERT_COLUMNS = {} as { [K in keyof DB]?: Partial<{ [C in keyof DB[K]]: ValueExpression<DB, K, unknown> }> };

const getUpsertColumns = <K extends keyof DB>(table: TableMetadata & { name: K }) => {
  if (!(table.name in UPSERT_COLUMNS)) {
    UPSERT_COLUMNS[table.name] = Object.fromEntries(
      table.columns.map((column) => [column.name, sql`excluded.${sql.ref(column.name)}`]),
    ) as Partial<{ [C in keyof DB[K]]: RawBuilder<unknown> }>;
  }

  return UPSERT_COLUMNS[table.name]!;
};

const mapUpsertColumns = <T extends keyof DB>(
  columns: Record<keyof DB[T], ValueExpression<DB, T, unknown>>,
  entries: InsertObjectOrList<DB, T>,
  conflictKeys: (keyof DB[T])[],
) => {
  const entry: InsertObject<DB, T> = Array.isArray(entries) ? entries[0] : entries;
  const upsertColumns: Partial<Record<keyof typeof entry, ValueExpression<DB, T, unknown>>> = {};
  for (const entryColumn in entry) {
    if (!conflictKeys.includes(entryColumn as keyof DB[T])) {
      upsertColumns[entryColumn as keyof typeof entry] = columns[entryColumn as keyof DB[T]];
    }
  }

  return upsertColumns as Expand<Record<keyof typeof entry, ValueExpression<DB, T, unknown>>>;
};

export const upsertHelper = <T extends keyof DB>(
  db: Kysely<DB>,
  table: TableMetadata & { name: T },
  values: InsertObjectOrList<DB, T>,
  conflictKeys: (string & keyof DB[T])[],
) =>
  db
    .insertInto(table.name)
    .values(values)
    .onConflict((oc) =>
      oc.columns(conflictKeys).doUpdateSet(() => mapUpsertColumns(getUpsertColumns(table), values, conflictKeys)),
    );

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
