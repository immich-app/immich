import 'dart:async';

import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:logging/logging.dart';

const kCloudIdChunkSize = 5000;

Future<void> resolveCloudIds(
  NativeSyncApi nativeSyncApi,
  DriftLocalAlbumRepository albumRepository,
  List<String> assetIds, {
  Completer<void>? cancellation,
}) async {
  final logger = Logger('resolveCloudIds');

  for (int offset = 0; offset < assetIds.length; offset += kCloudIdChunkSize) {
    if (cancellation?.isCompleted ?? false) {
      logger.warning('Cloud ID resolution cancelled after $offset of ${assetIds.length} assets');
      return;
    }

    final end = offset + kCloudIdChunkSize;
    final chunk = assetIds.sublist(offset, end > assetIds.length ? assetIds.length : end);

    final cloudMapping = <String, String>{};
    for (final result in await nativeSyncApi.getCloudIdForAssetIds(chunk)) {
      if (result.cloudId != null) {
        cloudMapping[result.assetId] = result.cloudId!;
        continue;
      }

      if (result.errorKind == CloudIdErrorKind.unsupported) {
        logger.warning('Cloud IDs unavailable: ${result.error ?? "unsupported"}');
        return;
      }

      logger.fine(
        'Cannot fetch cloudId for asset with id: ${result.assetId}. '
        'Reason: ${result.errorKind?.name ?? "unknown"}. Error: ${result.error ?? "unknown"}',
      );
    }

    await albumRepository.updateCloudMapping(cloudMapping);
  }
}
