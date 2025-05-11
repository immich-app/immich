import 'package:immich_mobile/interfaces/activity_api.interface.dart';
import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:logging/logging.dart';

class ActivityService with ErrorLoggerMixin {
  final IActivityApiRepository _activityApiRepository;

  @override
  final Logger logger = Logger("ActivityService");

  ActivityService(this._activityApiRepository);

  Future<List<Activity>> getAllActivities(
    String albumId, {
    String? assetId,
  }) async {
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
        await _activityApiRepository.delete(id);
        return true;
      },
      defaultValue: false,
      errorMessage: "Failed to delete activity",
    );
  }

  AsyncFuture<Activity> addActivity(
    String albumId,
    ActivityType type, {
    String? assetId,
    String? comment,
  }) async {
    return guardError(
      () => _activityApiRepository.create(
        albumId,
        type,
        assetId: assetId,
        comment: comment,
      ),
      errorMessage: "Failed to create $type for album $albumId",
    );
  }
}
