import 'package:immich_mobile/constants/errors.dart';
import 'package:immich_mobile/mixins/error_logger.mixin.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class ActivityService with ErrorLoggerMixin {
  final ApiService _apiService;

  @override
  final Logger logger = Logger("ActivityService");

  ActivityService(this._apiService);

  Future<List<Activity>> getAllActivities(
    String albumId, {
    String? assetId,
  }) async {
    return logError(
      () async {
        final list = await _apiService.activityApi
            .getActivities(albumId, assetId: assetId);
        return list != null ? list.map(Activity.fromDto).toList() : [];
      },
      defaultValue: [],
      errorMessage: "Failed to get all activities for album $albumId",
    );
  }

  Future<int> getStatistics(String albumId, {String? assetId}) async {
    return logError(
      () async {
        final dto = await _apiService.activityApi
            .getActivityStatistics(albumId, assetId: assetId);
        return dto?.comments ?? 0;
      },
      defaultValue: 0,
      errorMessage: "Failed to statistics for album $albumId",
    );
  }

  Future<bool> removeActivity(String id) async {
    return logError(
      () async {
        await _apiService.activityApi.deleteActivity(id);
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
      () async {
        final dto = await _apiService.activityApi.createActivity(
          ActivityCreateDto(
            albumId: albumId,
            type: type == ActivityType.comment
                ? ReactionType.comment
                : ReactionType.like,
            assetId: assetId,
            comment: comment,
          ),
        );
        if (dto != null) {
          return Activity.fromDto(dto);
        }
        throw NoResponseDtoError();
      },
      errorMessage: "Failed to create $type for album $albumId",
    );
  }
}
