import 'package:immich_data/data_controller.dart';
import 'package:immich_data/model/activity.dart';
import 'package:immich_data/server/activity.dart';
import 'package:immich_data/server/errors.dart';
import 'package:immich_data/store/util/slice.dart';
import 'package:logging/logging.dart';
import 'package:meta/meta.dart';
import 'package:openapi/api.dart';
import 'package:riverpod/riverpod.dart';

final _log = Logger("ActivityStore");

@visibleForTesting
final activityApiProvider = Provider<ActivityApiRepository>(
  (ref) => ActivityApiRepository(ActivitiesApi(ref.watch(dataControllerProvider.select((c) => c.apiClient)))),
);

/// Activities (comments and likes) on shared albums and their assets
///
/// State is fetched over HTTP and mutated and cached in memory
// TODO(agg23): This should not be called simply "Activity"
extension type const ActivityStore._(Provider<ActivityMutations> _provider) implements Provider<ActivityMutations> {
  static final _slice = Slice<ActivityMutations, ActivityEvent, List<Activity>, ActivityScope>(
    commands: (ref, bus) => ActivityMutations._(ref.watch(activityApiProvider), bus),
    fetch: _fetch,
    apply: _apply,
  );

  @internal
  static final ActivityStore instance = ActivityStore._(_slice.commands);

  /// All activities for an album specified by [albumId], or all activities for a specific asset within that album
  ///
  /// **NOTE:** This is currently reactive only to in memory mutation, not live HTTP changes
  SliceQuery<List<Activity>, ActivityEvent, ActivityScope> list(String albumId, {String? assetId}) =>
      _slice.query((albumId, assetId));

  static Future<List<Activity>> _fetch(Ref<AsyncValue<List<Activity>>> ref, ActivityScope scope) async {
    try {
      return await ref.read(activityApiProvider).getAll(scope.$1, assetId: scope.$2);
    } catch (error, stack) {
      _log.severe("Failed to get all activities for album ${scope.$1}", error, stack);
      return const [];
    }
  }

  static List<Activity> _apply(List<Activity> current, ActivityEvent event, ActivityScope scope) => switch (event) {
    ActivityUpserted(:final albumId, :final activity) =>
      // If there is a list for our album, we update it no matter what
      // If there is a list for our specific asset, we also update that
      albumId == scope.$1 && (scope.$2 == null || scope.$2 == activity.assetId) ? _upsert(current, activity) : current,
    ActivityRemoved(:final albumId, :final activityId) => albumId == scope.$1 ? _remove(current, activityId) : current,
  };

  static List<Activity> _upsert(List<Activity> activities, Activity activity) {
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
  }

  static List<Activity> _remove(List<Activity> activities, String activityId) =>
      activities.where((a) => a.id != activityId).toList();
}

/// Mutations for activities. Each completed mutation is published as an [ActivityEvent]
///
/// Failures are logged with context and rethrown
// TODO(agg23): This should not be called simply "Activity"
class ActivityMutations {
  final ActivityApiRepository _api;
  final EventBus<ActivityEvent> _bus;

  const ActivityMutations._(this._api, this._bus);

  /// Add a comment to an album or asset. Providing [assetId] will add to the corresponding asset, otherwise the comment will be added to the album
  Future<Activity> addComment(String albumId, String comment, {String? assetId}) async {
    try {
      final activity = await _api.create(albumId, ActivityType.comment, assetId: assetId, comment: comment);
      _bus.publish(ActivityUpserted(albumId, activity));
      return activity;
    } catch (error, stack) {
      _log.severe("Failed to create comment for album $albumId", error, stack);
      rethrow;
    }
  }

  /// Add a like to an album or asset Providing [assetId] will add to the corresponding asset, otherwise the like will be added to the album
  Future<Activity> addLike(String albumId, {String? assetId}) async {
    try {
      final activity = await _api.create(albumId, ActivityType.like, assetId: assetId);
      _bus.publish(ActivityUpserted(albumId, activity));
      return activity;
    } catch (error, stack) {
      _log.severe("Failed to create like for album $albumId", error, stack);
      rethrow;
    }
  }

  /// Remove an activity by its [activityId]
  Future<void> remove(String albumId, String activityId) async {
    try {
      await _api.delete(activityId);
    } on NoResponseDtoError {
      // TODO(agg23): This error should not be thrown at all
    } catch (error, stack) {
      _log.severe("Failed to delete activity", error, stack);
      rethrow;
    }

    // Only publish on success (including the broken NoResponseDtoError)
    _bus.publish(ActivityRemoved(albumId, activityId));
  }
}

/// The `albumId` and optional `assetId` pair an activity list is scoped to
typedef ActivityScope = (String albumId, String? assetId);

/// A completed mutation to the activities of an album
sealed class ActivityEvent {
  const ActivityEvent();
}

/// Created/updated [activity] within the album [albumId]
final class ActivityUpserted extends ActivityEvent {
  final String albumId;
  final Activity activity;

  const ActivityUpserted(this.albumId, this.activity);
}

/// Deleted [activityId] from album [albumId]
final class ActivityRemoved extends ActivityEvent {
  final String albumId;
  final String activityId;

  const ActivityRemoved(this.albumId, this.activityId);
}
