import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_data/model/activity.dart';
import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/mixins/stream_notifier.mixin.dart';
import 'package:immich_mobile/providers/infrastructure/data_store.dart';
import 'package:logging/logging.dart';

/// Activities associated with a `albumId`, `assetId` pair
final albumActivityProvider = AsyncNotifierProvider.autoDispose
    .family<_AlbumActivity, List<Activity>, (String albumId, String? assetId)>(_AlbumActivity.new);

class _AlbumActivity extends AutoDisposeFamilyAsyncNotifier<List<Activity>, (String albumId, String? assetId)>
    with ErrorLoggerMixin, StreamNotifierMixin<List<Activity>> {
  @override
  final Logger logger = Logger("ActivityService");

  late String albumId;
  late String? assetId;

  @override
  Future<List<Activity>> build((String albumId, String? assetId) args) {
    albumId = args.$1;
    assetId = args.$2;

    return buildFromStream(
      ref,
      // TODO(rewrite): `force: true` matches the previous behavior of a HTTP request on mount
      ref.watch(Store.activities).getAll(albumId, assetId: assetId, force: true),
      onError: (error, stack) {
        logger.severe("Failed to get all activities for album $albumId", error, stack);
        return const [];
      },
    );
  }

  Future<void> removeActivity(String id) async {
    await logError(
      () async {
        await ref.read(Store.activities).remove(albumId, id);
      },
      defaultValue: null,
      errorMessage: "Failed to delete activity",
    );
  }

  Future<void> addLike() async {
    await guardError(
      () => ref.read(Store.activities).addLike(albumId, assetId: assetId),
      errorMessage: "Failed to create like for album $albumId",
    );
  }

  Future<void> addComment(String comment) async {
    await guardError(
      () => ref.read(Store.activities).addComment(albumId, comment, assetId: assetId),
      errorMessage: "Failed to create comment for album $albumId",
    );
  }
}
