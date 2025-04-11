import { Expression, ExpressionBuilder, ExpressionWrapper, Nullable, Selectable, Simplify, sql } from 'kysely';

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
