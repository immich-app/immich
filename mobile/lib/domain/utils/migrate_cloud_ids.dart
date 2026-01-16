import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/asset_metadata.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/entities/local_asset.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:logging/logging.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart' hide AssetVisibility;

Future<void> syncCloudIds(ProviderContainer ref) async {
  if (!CurrentPlatform.isIOS) {
    return;
  }
  final logger = Logger('migrateCloudIds');

  final db = ref.read(driftProvider);
  // Populate cloud IDs for local assets that don't have one yet
  await _populateCloudIds(db);

  final serverInfo = await ref.read(serverInfoProvider.notifier).getServerInfo();
  final canUpdateMetadata = serverInfo.serverVersion.isAtLeast(major: 2, minor: 4);
  if (!canUpdateMetadata) {
    logger.fine('Server version does not support asset metadata updates. Skipping cloudId migration.');
    return;
  }
  final canBulkUpdateMetadata = serverInfo.serverVersion.isAtLeast(major: 2, minor: 5);

  // Wait for remote sync to complete, so we have up-to-date asset metadata entries
  try {
    await ref.read(syncStreamServiceProvider).sync();
  } catch (e, s) {
    logger.fine('Failed to complete remote sync before cloudId migration.', e, s);
    return;
  }

  // Fetch the mapping for backed up assets that have a cloud ID locally but do not have a cloud ID on the server
  final currentUser = ref.read(currentUserProvider);
  if (currentUser == null) {
    logger.warning('Current user is null. Aborting cloudId migration.');
    return;
  }

  final mappingsToUpdate = await _fetchCloudIdMappings(db, currentUser.id);
  // Deduplicate mappings as a single remote asset ID can match multiple local assets
  final seenRemoteAssetIds = <String>{};
  final uniqueMapping = mappingsToUpdate.where((mapping) {
    if (!seenRemoteAssetIds.add(mapping.remoteAssetId)) {
      logger.fine('Duplicate remote asset ID found: ${mapping.remoteAssetId}. Skipping duplicate entry.');
      return false;
    }
    return true;
  }).toList();

  final assetApi = ref.read(apiServiceProvider).assetsApi;

  if (canBulkUpdateMetadata) {
    await _bulkUpdateCloudIds(assetApi, uniqueMapping);
    return;
  }
  await _sequentialUpdateCloudIds(assetApi, uniqueMapping);
}

Future<void> _sequentialUpdateCloudIds(AssetsApi assetsApi, List<_CloudIdMapping> mappings) async {
  for (final mapping in mappings) {
    final item = AssetMetadataUpsertItemDto(
      key: kMobileMetadataKey,
      value: RemoteAssetMobileAppMetadata(
        cloudId: mapping.localAsset.cloudId,
        createdAt: mapping.localAsset.createdAt.toIso8601String(),
        adjustmentTime: mapping.localAsset.adjustmentTime?.toIso8601String(),
        latitude: mapping.localAsset.latitude?.toString(),
        longitude: mapping.localAsset.longitude?.toString(),
      ),
    );
    try {
      await assetsApi.updateAssetMetadata(mapping.remoteAssetId, AssetMetadataUpsertDto(items: [item]));
    } catch (error, stack) {
      Logger('migrateCloudIds').warning('Failed to update metadata for asset ${mapping.remoteAssetId}', error, stack);
    }
  }
}

Future<void> _bulkUpdateCloudIds(AssetsApi assetsApi, List<_CloudIdMapping> mappings) async {
  const batchSize = 10000;
  for (int i = 0; i < mappings.length; i += batchSize) {
    final endIndex = (i + batchSize > mappings.length) ? mappings.length : i + batchSize;
    final batch = mappings.sublist(i, endIndex);
    final items = <AssetMetadataBulkUpsertItemDto>[];
    for (final mapping in batch) {
      items.add(
        AssetMetadataBulkUpsertItemDto(
          assetId: mapping.remoteAssetId,
          key: kMobileMetadataKey,
          value: RemoteAssetMobileAppMetadata(
            cloudId: mapping.localAsset.cloudId,
            createdAt: mapping.localAsset.createdAt.toIso8601String(),
            adjustmentTime: mapping.localAsset.adjustmentTime?.toIso8601String(),
            latitude: mapping.localAsset.latitude?.toString(),
            longitude: mapping.localAsset.longitude?.toString(),
          ),
        ),
      );
    }
    try {
      await assetsApi.updateBulkAssetMetadata(AssetMetadataBulkUpsertDto(items: items));
    } catch (error, stack) {
      Logger('migrateCloudIds').warning('Failed to bulk update metadata', error, stack);
    }
  }
}

Future<void> _populateCloudIds(Drift drift) async {
  final query = drift.localAssetEntity.selectOnly()
    ..addColumns([drift.localAssetEntity.id])
    ..where(drift.localAssetEntity.iCloudId.isNull());
  final ids = await query.map((row) => row.read(drift.localAssetEntity.id)!).get();
  final cloudMapping = <String, String>{};
  final cloudIds = await NativeSyncApi().getCloudIdForAssetIds(ids);
  for (int i = 0; i < cloudIds.length; i++) {
    final cloudIdResult = cloudIds[i];
    if (cloudIdResult.cloudId != null) {
      cloudMapping[cloudIdResult.assetId] = cloudIdResult.cloudId!;
    } else {
      Logger('migrateCloudIds').fine(
        "Cannot fetch cloudId for asset with id: ${cloudIdResult.assetId}. Error: ${cloudIdResult.error ?? "unknown"}",
      );
    }
  }
  await DriftLocalAlbumRepository(drift).updateCloudMapping(cloudMapping);
}

typedef _CloudIdMapping = ({String remoteAssetId, LocalAsset localAsset});

Future<List<_CloudIdMapping>> _fetchCloudIdMappings(Drift drift, String userId) async {
  final query =
      drift.remoteAssetEntity.select().join([
        leftOuterJoin(
          drift.localAssetEntity,
          drift.localAssetEntity.checksum.equalsExp(drift.remoteAssetEntity.checksum),
        ),
        leftOuterJoin(
          drift.remoteAssetCloudIdEntity,
          drift.remoteAssetEntity.id.equalsExp(drift.remoteAssetCloudIdEntity.assetId),
          useColumns: false,
        ),
      ])..where(
        // Only select assets that have a local cloud ID but either no remote cloud ID or a mismatched eTag
        drift.localAssetEntity.id.isNotNull() &
            drift.localAssetEntity.iCloudId.isNotNull() &
            drift.remoteAssetEntity.ownerId.equals(userId) &
            // Skip locked assets as we cannot update them without unlocking first
            drift.remoteAssetEntity.visibility.isNotValue(AssetVisibility.locked.index) &
            (drift.remoteAssetCloudIdEntity.cloudId.isNull() |
                drift.remoteAssetCloudIdEntity.adjustmentTime.isNotExp(drift.localAssetEntity.adjustmentTime) |
                drift.remoteAssetCloudIdEntity.latitude.isNotExp(drift.localAssetEntity.latitude) |
                drift.remoteAssetCloudIdEntity.longitude.isNotExp(drift.localAssetEntity.longitude) |
                drift.remoteAssetCloudIdEntity.createdAt.isNotExp(drift.localAssetEntity.createdAt)),
      );
  return query.map((row) {
    return (
      remoteAssetId: row.read(drift.remoteAssetEntity.id)!,
      localAsset: row.readTable(drift.localAssetEntity).toDto(),
    );
  }).get();
}
