import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/errors.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/repositories/activity_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:logging/logging.dart';
import 'package:immich_mobile/entities/store.entity.dart' as immich_store;

class ActivityService with ErrorLoggerMixin {
  final ActivityApiRepository _activityApiRepository;
  final TimelineFactory _timelineFactory;
  final AssetService _assetService;

  @override
  final Logger logger = Logger("ActivityService");

  ActivityService(this._activityApiRepository, this._timelineFactory, this._assetService);

  Future<List<Activity>> getAllActivities(String albumId, {String? assetId}) async {
    return logError(
      () => _activityApiRepository.getAll(albumId, assetId: assetId),
      defaultValue: [],
      errorMessage: "Failed to get all activities for album $albumId",
    );
  }

  Future<ActivityStats> getStatistics(String albumId, {String? assetId}) async {
    return logError(
      () => _activityApiRepository.getStats(albumId, assetId: assetId),
      defaultValue: const ActivityStats(comments: 0),
      errorMessage: "Failed to statistics for album $albumId",
    );
  }

  Future<bool> removeActivity(String id) async {
    return logError(
      () async {
        try {
          await _activityApiRepository.delete(id);
        } on NoResponseDtoError {
          return true;
        }
        return true;
      },
      defaultValue: false,
      errorMessage: "Failed to delete activity",
    );
  }

  AsyncFuture<Activity> addActivity(String albumId, ActivityType type, {String? assetId, String? comment}) async {
    return guardError(
      () => _activityApiRepository.create(albumId, type, assetId: assetId, comment: comment),
      errorMessage: "Failed to create $type for album $albumId",
    );
  }

  Future<AssetViewerRoute?> buildAssetViewerRoute(String assetId, WidgetRef ref) async {
    if (immich_store.Store.isBetaTimelineEnabled) {
      final asset = await _assetService.getRemoteAsset(assetId);
      if (asset == null) {
        return null;
      }

      AssetViewer.setAsset(ref, asset);
      return AssetViewerRoute(
        initialIndex: 0,
        timelineService: _timelineFactory.fromAssets([asset], TimelineOrigin.albumActivities),
        currentAlbum: ref.read(currentRemoteAlbumProvider),
      );
    }

    return null;
  }
}
