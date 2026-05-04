import 'package:drift/drift.dart';
import 'package:immich_mobile/infrastructure/entities/shared_space.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

// Mirrors the server `shared_space_library` join row. spaceId has a FK to
// SharedSpaceEntity with cascade delete. libraryId is intentionally a loose
// reference (no FK) — same reasoning as SharedSpaceAssetEntity.assetId: the
// library row may not yet be locally synced when this join row arrives.
@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_shared_space_library_space_id ON shared_space_library_entity (space_id)',
)
@TableIndex.sql(
  'CREATE INDEX IF NOT EXISTS idx_shared_space_library_library_space ON shared_space_library_entity (library_id, space_id)',
)
class SharedSpaceLibraryEntity extends Table with DriftDefaultsMixin {
  const SharedSpaceLibraryEntity();

  TextColumn get spaceId => text().references(SharedSpaceEntity, #id, onDelete: KeyAction.cascade)();

  // Intentionally NO references() on libraryId — same reasoning as
  // SharedSpaceAssetEntity.assetId: the library row may not yet be locally
  // synced when the join row arrives.
  TextColumn get libraryId => text()();

  TextColumn get addedById => text().nullable()();

  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {spaceId, libraryId};
}
