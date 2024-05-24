import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';

class LocalAsset extends Table {
  const LocalAsset();

  IntColumn get id => integer().autoIncrement()();
  TextColumn get localId => text()();
  TextColumn get name => text()();
  TextColumn get checksum => text()();
  IntColumn get height => integer()();
  IntColumn get width => integer()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdTime => dateTime()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
  IntColumn get duration => integer().withDefault(const Constant(0))();
  BoolColumn get isLivePhoto => boolean().withDefault(const Constant(false))();
}
