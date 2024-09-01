import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/asset.model.dart';

class Asset extends Table {
  const Asset();
  TextColumn get name => text()();
  TextColumn get checksum => text().unique()();
  IntColumn get height => integer().nullable()();
  IntColumn get width => integer().nullable()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdTime => dateTime()();
  DateTimeColumn get modifiedTime =>
      dateTime().withDefault(currentDateAndTime)();
  IntColumn get duration => integer().withDefault(const Constant(0))();
}
