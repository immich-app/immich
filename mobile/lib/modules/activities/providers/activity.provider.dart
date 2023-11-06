import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/activities/models/activity.model.dart';
import 'package:immich_mobile/modules/activities/services/activity.service.dart';

class ActivityNotifier extends StateNotifier<AsyncValue<List<Activity>>> {
  final Ref _ref;
  final ActivityService _activityService;
  final String albumId;
  final String? assetId;

  ActivityNotifier(
    this._ref,
    this._activityService,
    this.albumId,
    this.assetId,
  ) : super(
          const AsyncData([]),
        ) {
    fetchActivity();
  }

  Future<void> fetchActivity() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _activityService.getAllActivities(albumId, assetId),
    );
  }

  Future<void> removeActivity(String id) async {
    final activities = state.asData?.value ?? [];
    if (await _activityService.removeActivity(id)) {
      final removedActivity = activities.firstWhere((a) => a.id == id);
      activities.remove(removedActivity);
      state = AsyncData(activities);
      if (removedActivity.type == ActivityType.comment) {
        _ref
            .read(
              activityStatisticsStateProvider(
                (albumId: albumId, assetId: assetId),
              ).notifier,
            )
            .removeActivity();
      }
    }
  }

  Future<void> addComment(String comment) async {
    final activity = await _activityService.addActivity(
      albumId,
      ActivityType.comment,
      assetId: assetId,
      comment: comment,
    );

    if (activity != null) {
      final activities = state.asData?.value ?? [];
      state = AsyncData([...activities, activity]);
      _ref
          .read(
            activityStatisticsStateProvider(
              (albumId: albumId, assetId: assetId),
            ).notifier,
          )
          .addActivity();
      if (assetId != null) {
        // Add a count to the current album's provider as well
        _ref
            .read(
              activityStatisticsStateProvider(
                (albumId: albumId, assetId: null),
              ).notifier,
            )
            .addActivity();
      }
    }
  }

  Future<void> addLike() async {
    final activity = await _activityService
        .addActivity(albumId, ActivityType.like, assetId: assetId);
    if (activity != null) {
      final activities = state.asData?.value ?? [];
      state = AsyncData([...activities, activity]);
    }
  }
}

class ActivityStatisticsNotifier extends StateNotifier<int> {
  final String albumId;
  final String? assetId;
  final ActivityService _activityService;
  ActivityStatisticsNotifier(this._activityService, this.albumId, this.assetId)
      : super(0) {
    fetchStatistics();
  }

  Future<void> fetchStatistics() async {
    state = await _activityService.getStatistics(albumId, assetId: assetId);
  }

  Future<void> addActivity() async {
    state = state + 1;
  }

  Future<void> removeActivity() async {
    state = state - 1;
  }
}

typedef ActivityParams = ({String albumId, String? assetId});

final activityStateProvider = StateNotifierProvider.autoDispose
    .family<ActivityNotifier, AsyncValue<List<Activity>>, ActivityParams>(
        (ref, args) {
  return ActivityNotifier(
    ref,
    ref.watch(activityServiceProvider),
    args.albumId,
    args.assetId,
  );
});

final activityStatisticsStateProvider = StateNotifierProvider.autoDispose
    .family<ActivityStatisticsNotifier, int, ActivityParams>((ref, args) {
  return ActivityStatisticsNotifier(
    ref.watch(activityServiceProvider),
    args.albumId,
    args.assetId,
  );
});
