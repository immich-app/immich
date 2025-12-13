import { Kysely, sql } from 'kysely';

const items = [
  { oldName: 'album.addAsset', newName: 'albumAsset.create' },
  { oldName: 'album.removeAsset', newName: 'albumAsset.delete' },
  { oldName: 'admin.user.create', newName: 'adminUser.create' },
  { oldName: 'admin.user.read', newName: 'adminUser.read' },
  { oldName: 'admin.user.update', newName: 'adminUser.update' },
  { oldName: 'admin.user.delete', newName: 'adminUser.delete' },
];

export async function up(db: Kysely<any>): Promise<void> {
  for (const { oldName, newName } of items) {
    await sql`UPDATE "api_key" SET "permissions" = array_replace("permissions", ${oldName}, ${newName})`.execute(db);
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const { oldName, newName } of items) {
    await sql`UPDATE "api_key" SET "permissions" = array_replace("permissions", ${newName}, ${oldName})`.execute(db);
  }
}
