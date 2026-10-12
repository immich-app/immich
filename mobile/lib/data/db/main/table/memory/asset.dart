import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/table/memory/memory.dart';
import 'package:immich_mobile/data/db/main/table/remote/asset.dart';
import 'package:immich_mobile/data/db/util/defaults_mixin.dart';

class MemoryAssetEntity extends Table with DriftDefaultsMixin {
  const MemoryAssetEntity();

  TextColumn get assetId => text().references(RemoteAssetEntity, #id, onDelete: KeyAction.cascade)();

  TextColumn get memoryId => text().references(MemoryEntity, #id, onDelete: KeyAction.cascade)();

  @override
  Set<Column> get primaryKey => {assetId, memoryId};
}
