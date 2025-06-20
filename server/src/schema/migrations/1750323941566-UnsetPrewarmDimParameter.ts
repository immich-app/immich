import { Kysely, sql } from 'kysely';

export async function up(qb: Kysely<any>): Promise<void> {
  type Conf = { db: string; guc: string[] };
  const res = await sql<Conf>`select current_database() db, to_json(setconfig) guc from pg_db_role_setting`.execute(qb);
  if (res.rows.length === 0) {
    return;
  }

  await sql`alter database immich reset all;`.execute(qb);
  const { db, guc } = res.rows[0];
  for (const parameter of guc) {
    const [key, value] = parameter.split('=');
    if (key === 'vchordrq.prewarm_dim') {
      continue;
    }
    await sql.raw(`alter database "${db}" set ${key} to ${value};`).execute(qb);
  }
}

export async function down(db: Kysely<any>): Promise<void> {}
