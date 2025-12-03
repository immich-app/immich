import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/asset_metadata.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:logging/logging.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart';

Future<void> syncCloudIds(ProviderContainer ref) async {
  final db = ref.read(driftProvider);
  // Populate cloud IDs for local assets that don't have one yet
  await _populateCloudIds(db);

  // Wait for remote sync to complete, so we have up-to-date asset metadata entries
  await ref.read(syncStreamServiceProvider).sync();

  // Fetch the mapping for backed up assets that have a cloud ID locally but do not have a cloud ID on the server
  final currentUser = ref.read(currentUserProvider);
  if (currentUser == null) {
    Logger('migrateCloudIds').warning('Current user is null. Aborting cloudId migration.');
    return;
  }

  final mappingsToUpdate = await _fetchCloudIdMappings(db, currentUser.id);
  final assetApi = ref.read(apiServiceProvider).assetsApi;
  for (final mapping in mappingsToUpdate) {
    final mobileMeta = AssetMetadataUpsertItemDto(
      key: AssetMetadataKey.mobileApp,
      value: RemoteAssetMobileAppMetadata(cloudId: mapping.cloudId, eTag: mapping.eTag),
    );
    try {
      await assetApi.updateAssetMetadata(mapping.assetId, AssetMetadataUpsertDto(items: [mobileMeta]));
    } catch (error, stack) {
      Logger('migrateCloudIds').warning('Failed to update metadata for asset ${mapping.assetId}', error, stack);
    }
  }
}

Future<void> _populateCloudIds(Drift drift) async {
  final query = drift.localAssetEntity.selectOnly()
    ..addColumns([drift.localAssetEntity.id])
    ..where(drift.localAssetEntity.iCloudId.isNull());
  final ids = await query.map((row) => row.read(drift.localAssetEntity.id)!).get();
  final cloudMapping = await NativeSyncApi().getCloudIdForAssetIds(ids);
  await DriftLocalAlbumRepository(drift).updateCloudMapping(cloudMapping);
}

typedef _CloudIdMapping = ({String assetId, String cloudId, String eTag});

Future<List<_CloudIdMapping>> _fetchCloudIdMappings(Drift drift, String userId) async {
  final query =
      drift.remoteAssetEntity.selectOnly().join([
          leftOuterJoin(
            drift.localAssetEntity,
            drift.localAssetEntity.checksum.equalsExp(drift.remoteAssetEntity.checksum),
            useColumns: false,
          ),
          leftOuterJoin(
            drift.remoteAssetCloudIdEntity,
            drift.localAssetEntity.iCloudId.equalsExp(drift.remoteAssetCloudIdEntity.cloudId),
            useColumns: false,
          ),
        ])
        ..addColumns([
          drift.remoteAssetEntity.id,
          drift.localAssetEntity.iCloudId,
          drift.localAssetEntity.createdAt,
          drift.localAssetEntity.adjustmentTime,
          drift.localAssetEntity.latitude,
          drift.localAssetEntity.longitude,
        ])
        ..where(
          drift.localAssetEntity.id.isNotNull() &
              drift.localAssetEntity.iCloudId.isNotNull() &
              drift.remoteAssetEntity.ownerId.equals(userId) &
              drift.remoteAssetCloudIdEntity.cloudId.isNull(),
        );
  return query.map((row) {
    final createdAt = row.read(drift.localAssetEntity.createdAt)!;
    final adjustmentTime = row.read(drift.localAssetEntity.adjustmentTime);
    final latitude = row.read(drift.localAssetEntity.latitude);
    final longitude = row.read(drift.localAssetEntity.longitude);
    final eTag =
        "${createdAt.millisecondsSinceEpoch ~/ 1000}$kUploadETagDelimiter${(adjustmentTime?.millisecondsSinceEpoch ?? 0) ~/ 1000}$kUploadETagDelimiter${latitude ?? 0}$kUploadETagDelimiter${longitude ?? 0}";
    return (
      assetId: row.read(drift.remoteAssetEntity.id)!,
      cloudId: row.read(drift.localAssetEntity.iCloudId)!,
      eTag: eTag,
    );
  }).get();
}
