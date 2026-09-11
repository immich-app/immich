import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/activity.dart';
import 'package:immich_mobile/data/server/errors.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:logging/logging.dart';

final _log = Logger("ActivityStore");

/// The `albumId` and optional `assetId` identifying an activity list
typedef ActivityScope = (String albumId, String? assetId);

/// Activities (comments and likes) on shared albums and their assets
///
/// State is fetched over HTTP and mutated and cached in memory
extension type const ActivityStore._(Provider<ActivityMutations> _provider) implements Provider<ActivityMutations> {
  /// Internal: access through `Store.activity`
  static final ActivityStore instance = ActivityStore._(Provider((ref) => ActivityMutations._(ref)));

  /// All activities for an album specified by [albumId], or all activities for a specific asset within that album
  ///
  /// **NOTE:** This is currently reactive only to in memory mutation, not live HTTP changes
  CacheListQuery<Activity, ActivityScope> list(String albumId, {String? assetId}) => _cache.family((albumId, assetId));
}

final _cache = _ActivityCache();

class _ActivityCache extends StoreCache<Activity, ActivityScope> {
  @override
  Future<List<Activity>> fetch(Ref ref, ActivityScope scope) async {
    try {
      return await ref.watch(activityApiRepositoryProvider).getAll(scope.$1, assetId: scope.$2);
    } catch (error, stack) {
      _log.severe("Failed to get all activities for album ${scope.$1}", error, stack);
      return const [];
    }
  }

  @override
  Object identity(Activity item) => item.id;

  @override
  bool shouldContain(ActivityScope scope, Activity item) =>
      scope.$1 == item.albumId && (scope.$2 == null || scope.$2 == item.assetId);
}

class ActivityMutations extends CachedStoreMutations<Activity, ActivityScope> {
  ActivityMutations._(Ref ref) : super(ref, _cache);

  /// Add a comment to an album or asset. Providing [assetId] will add to the corresponding asset, otherwise the comment will be added to the album
  Future<Activity> addComment(String albumId, String comment, {String? assetId}) async {
    try {
      final activity = await read(
        activityApiRepositoryProvider,
      ).create(albumId, ActivityType.comment, assetId: assetId, comment: comment);
      cacheUpsert(activity);
      return activity;
    } catch (error, stack) {
      _log.severe("Failed to create comment for album $albumId", error, stack);
      rethrow;
    }
  }

  /// Add a like to an album or asset. Providing [assetId] will add to the corresponding asset, otherwise the like will be added to the album
  Future<Activity> addLike(String albumId, {String? assetId}) async {
    try {
      final activity = await read(activityApiRepositoryProvider).create(albumId, ActivityType.like, assetId: assetId);
      cacheUpsert(activity);
      return activity;
    } catch (error, stack) {
      _log.severe("Failed to create like for album $albumId", error, stack);
      rethrow;
    }
  }

  /// Remove [activity] from its album
  Future<void> remove(Activity activity) async {
    try {
      await read(activityApiRepositoryProvider).delete(activity.id);
    } on NoResponseDtoError {
      // TODO(agg23): This error should not be thrown at all
    } catch (error, stack) {
      _log.severe("Failed to delete activity", error, stack);
      rethrow;
    }

    // Only apply on success (including the broken NoResponseDtoError)
    cacheRemove(activity.id);
  }
}
