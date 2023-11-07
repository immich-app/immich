import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/activities/models/activity.model.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final activityServiceProvider =
    Provider((ref) => ActivityService(ref.watch(apiServiceProvider)));

class ActivityService {
  final ApiService _apiService;
  final Logger _log = Logger("ActivityService");

  ActivityService(this._apiService);

  Future<List<Activity>> getAllActivities(
    String albumId,
    String? assetId,
  ) async {
    try {
      final list = await _apiService.activityApi
          .getActivities(albumId, assetId: assetId);
      return list != null ? list.map(Activity.fromDto).toList() : [];
    } catch (e) {
      _log.severe(
        "failed to fetch activities for albumId - $albumId; assetId - $assetId -> $e",
      );
      rethrow;
    }
  }

  Future<int> getStatistics(String albumId, {String? assetId}) async {
    try {
      final dto = await _apiService.activityApi
          .getActivityStatistics(albumId, assetId: assetId);
      return dto?.comments ?? 0;
    } catch (e) {
      _log.severe(
        "failed to fetch activity statistics for albumId - $albumId; assetId - $assetId -> $e",
      );
    }
    return 0;
  }

  Future<bool> removeActivity(String id) async {
    try {
      await _apiService.activityApi.deleteActivity(id);
      return true;
    } catch (e) {
      _log.severe(
        "failed to remove activity id - $id -> $e",
      );
    }
    return false;
  }

  Future<Activity?> addActivity(
    String albumId,
    ActivityType type, {
    String? assetId,
    String? comment,
  }) async {
    try {
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
    } catch (e) {
      _log.severe(
        "failed to add activity for albumId - $albumId; assetId - $assetId -> $e",
      );
    }
    return null;
  }
}
