import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "shared_space_library" (
  "spaceId" uuid NOT NULL,
  "libraryId" uuid NOT NULL,
  "addedById" uuid,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "shared_space_library_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "shared_space" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "shared_space_library_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "library" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "shared_space_library_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "shared_space_library_pkey" PRIMARY KEY ("spaceId", "libraryId")
);`.execute(db);
  await sql`CREATE INDEX "shared_space_library_libraryId_idx" ON "shared_space_library" ("libraryId");`.execute(db);
  await sql`CREATE INDEX "shared_space_library_addedById_idx" ON "shared_space_library" ("addedById");`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "shared_space_library";`.execute(db);
}
