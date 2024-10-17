import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/entities/asset.entity.dart';

class Album extends Table {
  const Album();

  IntColumn get id => integer().autoIncrement()();
  TextColumn get name => text()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();

  IntColumn get thumbnailAssetId => integer()
      .references(Asset, #id, onDelete: KeyAction.setNull)
      .nullable()();

  // Local only
  TextColumn get localId => text().nullable().unique()();

  // Remote only
  TextColumn get remoteId => text().nullable().unique()();
}
