import { Kysely, sql } from 'kysely';

export async function up(qb: Kysely<any>): Promise<void> {
  type Conf = { db: string; guc: string[] };
  const res = await sql<Conf>`
    select current_database() db, to_json(setconfig) guc
    from pg_db_role_setting
    where setdatabase = (select oid from pg_database where datname = current_database())
      and setrole = 0;`.execute(qb);
  if (res.rows.length === 0) {
    return;
  }

  const { db, guc } = res.rows[0];
  await sql.raw(`alter database "${db}" reset all;`).execute(qb);
  for (const parameter of guc) {
    const [key, value] = parameter.split('=');
    if (key === 'vchordrq.prewarm_dim') {
      continue;
    }
    await sql.raw(`alter database "${db}" set ${key} to ${value};`).execute(qb);
  }
}

export async function down(): Promise<void> {}
