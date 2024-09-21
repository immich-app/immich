import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';

@TableIndex(name: 'asset_localid', columns: {#localId})
@TableIndex(name: 'asset_remoteid', columns: {#remoteId})
class Asset extends Table {
  const Asset();

  IntColumn get id => integer().autoIncrement()();

  TextColumn get name => text()();
  TextColumn get hash => text().unique()();
  IntColumn get height => integer().nullable()();
  IntColumn get width => integer().nullable()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdTime => dateTime()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
  IntColumn get duration => integer().withDefault(const Constant(0))();

  // Local only
  TextColumn get localId => text().nullable()();

  // Remote only
  TextColumn get remoteId => text().nullable()();
  TextColumn get livePhotoVideoId => text().nullable()();
}
