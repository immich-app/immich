import 'package:drift/drift.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';

class LocalAssetUploadEntity extends Table with DriftDefaultsMixin {
  const LocalAssetUploadEntity();

  TextColumn get assetId => text().references(LocalAssetEntity, #id, onDelete: KeyAction.cascade)();

  IntColumn get numberOfAttempts => integer().withDefault(const Constant(0))();
  DateTimeColumn get lastAttemptAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get errorType => intEnum<UploadErrorType>().withDefault(const Constant(0))();
  TextColumn get errorMessage => text().nullable()();

  @override
  Set<Column> get primaryKey => {assetId};
}
