import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/device_album_state.model.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/device_asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'device_assets.provider.g.dart';

@riverpod
class DeviceAssets extends _$DeviceAssets {
  @override
  Future<DeviceAssetState> build() async {
    final db = ref.read(dbProvider);
    final idsToBackup = await db.deviceAssets
        .filter()
        .backupSelectionEqualTo(BackupSelection.select)
        .idProperty()
        .findAll();
    return DeviceAssetState(
      assetIdsForBackup: idsToBackup,
      uniqueAssetsToBackup: await db.assets
          .filter()
          .anyOf(idsToBackup, (q, id) => q.localIdEqualTo(id))
          .count(),
      backedUpAssets: await db.assets
          .where()
          .remoteIdIsNotNull()
          .filter()
          .anyOf(idsToBackup, (q, id) => q.localIdEqualTo(id))
          .count(),
    );
  }
}
