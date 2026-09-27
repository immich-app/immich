import 'dart:async';

import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:logging/logging.dart';

/// Progress of the thumbnail prefetch. `total` is zero when it is not running.
typedef ThumbnailPrefetchProgress = ({int done, int total});

/// Downloads the thumbnails of the whole library into the on-disk cache so the
/// grid stays readable when the server cannot be reached.
class ThumbnailPrefetchNotifier extends Notifier<ThumbnailPrefetchProgress> {
  static const _batchSize = 250;

  final _log = Logger('ThumbnailPrefetchNotifier');

  @override
  ThumbnailPrefetchProgress build() => (done: 0, total: 0);

  Future<void> run() async {
    if (state.total != 0) {
      return;
    }

    try {
      final targets = await ref.read(driftProvider).remoteAssetRepository.getThumbnailTargets();
      state = (done: 0, total: targets.length);
      _log.info('Prefetching ${targets.length} thumbnails');

      for (final batch in targets.slices(_batchSize)) {
        await remoteImageApi.prefetchThumbnails([
          for (final asset in batch) getThumbnailUrlForRemoteId(asset.id, thumbhash: asset.thumbHash),
        ]);

        if (state.total == 0) {
          return; // отменено
        }
        state = (done: state.done + batch.length, total: state.total);
      }
    } catch (error, stackTrace) {
      _log.severe('Thumbnail prefetch failed', error, stackTrace);
    } finally {
      state = (done: 0, total: 0);
    }
  }

  void cancel() {
    state = (done: 0, total: 0);
    unawaited(remoteImageApi.cancelPrefetch());
  }
}

final thumbnailPrefetchProvider = NotifierProvider<ThumbnailPrefetchNotifier, ThumbnailPrefetchProgress>(
  ThumbnailPrefetchNotifier.new,
);
