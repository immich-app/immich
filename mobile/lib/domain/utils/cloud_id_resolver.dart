import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

@visibleForTesting
const kCloudIdChunkSize = 5000;

Future<void> resolveCloudIds(
  NativeSyncApi nativeSyncApi,
  DriftLocalAlbumRepository albumRepository,
  Iterable<String> assetIds, {
  Completer<void>? cancellation,
}) async {
  if (!CurrentPlatform.isIOS) {
    return;
  }

  final logger = Logger('resolveCloudIds');
  for (final batch in assetIds.slices(kCloudIdChunkSize)) {
    if (cancellation?.isCompleted ?? false) {
      logger.warning('Cloud ID resolution cancelled');
      return;
    }

    final List<CloudIdResult> results;
    try {
      results = await nativeSyncApi.getCloudIdForAssetIds(batch);
    } on PlatformException catch (error, stack) {
      if (error.code == kUnsupportedOSError) {
        logger.warning('Cloud IDs are unavailable on this device. Skipping resolution.', error, stack);
        return;
      }

      logger.warning('Cannot fetch cloudIds for ${batch.length} assets. Skipping batch.', error, stack);
      continue;
    }

    final cloudMapping = <String, String>{};
    for (final CloudIdResult(:assetId, :cloudId, :error, :errorKind) in results) {
      if (cloudId == null) {
        logger.fine(
          'Cannot fetch cloudId for asset with id: $assetId. '
          'Reason: ${errorKind?.name ?? "unknown"}. Error: ${error ?? "unknown"}',
        );
        continue;
      }

      cloudMapping[assetId] = cloudId;
    }

    await albumRepository.updateCloudMapping(cloudMapping);
  }
}
