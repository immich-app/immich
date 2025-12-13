import { sql } from 'kysely';
import { OverrideType, Reader } from 'src/sql-tools/types';

export const readOverrides: Reader = async (ctx, db) => {
  try {
    const result = await sql
      .raw<{
        name: string;
        value: { type: OverrideType; name: string; sql: string };
      }>(`SELECT name, value FROM "${ctx.overrideTableName}"`)
      .execute(db);

    for (const { name, value } of result.rows) {
      ctx.overrides.push({ name, value, synchronize: true });
    }
  } catch (error) {
    ctx.warn('Overrides', `Error reading override table: ${error}`);
  }
};
