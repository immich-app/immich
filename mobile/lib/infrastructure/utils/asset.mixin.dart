import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

mixin AssetEntityMixin on Table {
  TextColumn get name => text()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get durationInSeconds => integer().nullable()();
}
