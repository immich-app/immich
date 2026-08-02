import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/utils/datetime.converter.dart';

mixin AssetEntityMixin on Table {
  TextColumn get name => text()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime).map(const DateTimeClampConverter())();
  IntColumn get width => integer().nullable()();
  IntColumn get height => integer().nullable()();
  IntColumn get durationMs => integer().nullable()();
}
