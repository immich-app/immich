import 'package:immich_data/model/activity.dart';
import 'package:immich_data/server/activity.dart';
import 'package:immich_data/server/errors.dart';
import 'package:immich_data/store/util/stream_cache.dart';
import 'package:meta/meta.dart';

/// Activities (comments and likes) on shared albums and their assets
///
/// State is fetched over HTTP and mutated and cached in memory
// TODO(agg23): This should not be called simply "Activity"
class ActivityService {
  final ActivityApiRepository _api;

  late final StreamCache<(String albumId, String? assetId), List<Activity>> _cache = StreamCache(
    fetch: (scope) => _api.getAll(scope.$1, assetId: scope.$2),
  );

  @internal
  ActivityService(this._api);

  /// All activities for an album specified by [albumId], or all activities for a specific asset within that album.
  /// Providing [force] will make a new HTTP request on stream open (legacy behavior)
  ///
  /// **NOTE:** This is currently reactive only to in memory mutation, not live HTTP changes
  Stream<List<Activity>> getAll(String albumId, {String? assetId, bool force = false}) {
    return _cache.get((albumId, assetId), force: force);
  }

  /// Add a comment to an album or asset. Providing [assetId] will add to the corresponding asset, otherwise the comment will be added to the album
  Future<Activity> addComment(String albumId, String comment, {String? assetId}) async {
    final activity = await _api.create(albumId, ActivityType.comment, assetId: assetId, comment: comment);
    _upsert(albumId, activity);
    return activity;
  }

  /// Add a like to an album or asset Providing [assetId] will add to the corresponding asset, otherwise the like will be added to the album
  Future<Activity> addLike(String albumId, {String? assetId}) async {
    final activity = await _api.create(albumId, ActivityType.like, assetId: assetId);
    _upsert(albumId, activity);
    return activity;
  }

  /// Remove an activity by its [activityId]
  Future<void> remove(String albumId, String activityId) async {
    try {
      await _api.delete(activityId);
    } on NoResponseDtoError {
      // TODO(agg23): This error should not be thrown at all
    }

    // Only drop on "success" (including the broken NoResponseDtoError above)
    _drop(albumId, activityId);
  }

  /// Terminate all streams and dispose of the cache
  Future<void> dispose() {
    return _cache.dispose();
  }

  /// Apply an activity upsert to the in memory cache
  void _upsert(String albumId, Activity activity) {
    _cache.update(
      // If there is a list for our album, we update it no matter what
      // If there is a list for our specific asset, we also update that
      (scope) => scope.$1 == albumId && (scope.$2 == null || scope.$2 == activity.assetId),
      (activities) {
        final index = activities.indexWhere((a) => a.id == activity.id);

        if (index == -1) {
          // Insert new item
          return [...activities, activity];
        } else if (activities[index] == activity) {
          // No change
          return activities;
        } else {
          // Update existing
          return [...activities]..[index] = activity;
        }
      },
    );
  }

  /// Drop an activity from any cache entry that may contain it
  void _drop(String albumId, String activityId) {
    _cache.update((scope) => scope.$1 == albumId, (activities) => activities.where((a) => a.id != activityId).toList());
  }
}
