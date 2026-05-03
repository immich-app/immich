import {
  AfterDeleteTrigger,
  AfterInsertTrigger,
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { CreateIdColumn, UpdatedAtTrigger, UpdateIdColumn } from 'src/decorators';
import { SharedSpaceRole } from 'src/enum';
import {
  shared_space_member_after_insert,
  shared_space_member_after_insert_library,
  shared_space_member_delete_audit,
  shared_space_member_delete_library_audit,
} from 'src/schema/functions';
import { SharedSpaceTable } from 'src/schema/tables/shared-space.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('shared_space_member')
@UpdatedAtTrigger('shared_space_member_updatedAt')
// Bumps the parent shared_space row's updateId so members joining a space cause
// the space row to re-emit on next sync.
@AfterInsertTrigger({
  name: 'shared_space_member_after_insert',
  scope: 'statement',
  referencingNewTableAs: 'inserted_rows',
  function: shared_space_member_after_insert,
})
// Populates library_user + bumps library.updateId for every library linked
// to the space the new member joined. Name-suffixed with `_library` so it
// sorts after shared_space_member_after_insert in alphabetical trigger order.
// See docs/plans/2026-04-11-library-user-access-backfill-design.md.
@AfterInsertTrigger({
  name: 'shared_space_member_after_insert_library',
  scope: 'statement',
  referencingNewTableAs: 'inserted_rows',
  function: shared_space_member_after_insert_library,
})
// Always fires (no `when` clause). The function body distinguishes direct removal
// from cascade by checking whether the parent shared_space row still exists.
@AfterDeleteTrigger({
  scope: 'statement',
  function: shared_space_member_delete_audit,
  referencingOldTableAs: 'old',
})
// Second fan-out trigger: for each library linked to the space the member is
// leaving, emit a library_audit row iff the user has no other access path.
// Separate trigger (not merged into shared_space_member_delete_audit) so the
// two audit streams stay independent and the function bodies can be registered
// individually in migration_overrides.
@AfterDeleteTrigger({
  name: 'shared_space_member_delete_library_audit',
  scope: 'statement',
  function: shared_space_member_delete_library_audit,
  referencingOldTableAs: 'old',
})
export class SharedSpaceMemberTable {
  @ForeignKeyColumn(() => SharedSpaceTable, { onDelete: 'CASCADE', primary: true, index: false })
  spaceId!: string;

  @ForeignKeyColumn(() => UserTable, { onDelete: 'CASCADE', primary: true })
  userId!: string;

  @Column({ type: 'character varying', default: SharedSpaceRole.Viewer })
  role!: Generated<string>;

  @CreateDateColumn()
  joinedAt!: Generated<Timestamp>;

  @Column({ type: 'boolean', default: true })
  showInTimeline!: Generated<boolean>;

  @Column({ type: 'boolean', default: true })
  sharePersonMetadata!: Generated<boolean>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastViewedAt!: Timestamp | null;

  @CreateIdColumn({ index: true })
  createId!: Generated<string>;

  // NOTE: createdAt is functionally a duplicate of joinedAt. Both are populated by
  // `now()` defaults at insert time and should always be equal. The duplicate
  // exists because BaseSync's upsert/backfill helpers expect a `createdAt` column
  // by name, while `joinedAt` is the user-facing semantic name we don't want to
  // rename. A cleanup pass could unify these in a follow-up; out of scope for now.
  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;
}
