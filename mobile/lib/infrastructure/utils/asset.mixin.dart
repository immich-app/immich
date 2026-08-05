import 'package:drift/drift.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/utils/datetime_clamp.type.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

mixin AssetEntityMixin on DriftDefaultsMixin {
  TextColumn get name => text()();
  IntColumn get type => intEnum<AssetType>()();
  DateTimeColumn get createdAt => customType(clampedDateTime).withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => customType(clampedDateTime).withDefault(currentDateAndTime)();
  IntColumn get width => integer().nullable()();
  IntColumn get height => integer().nullable()();
  IntColumn get durationMs => integer().nullable()();
}
