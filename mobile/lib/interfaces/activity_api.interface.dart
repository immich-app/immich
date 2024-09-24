import 'package:immich_mobile/models/activities/activity.model.dart';

abstract interface class IActivityApiRepository {
  Future<List<Activity>> getAll(
    String albumId, {
    String? assetId,
  });
  Future<Activity> create(
    String albumId,
    ActivityType type, {
    String? assetId,
    String? comment,
  });
  Future<void> delete(String id);
  Future<ActivityStats> getStats(String albumId, {String? assetId});
}
