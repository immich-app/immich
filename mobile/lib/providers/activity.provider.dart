import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';

const _pageSize = 50;

// ignore: unintended_html_in_doc_comment
/// Maintains the current list of all activities for <share-album-id, asset>

final albumActivityProvider = AsyncNotifierProvider.autoDispose
    .family<AlbumActivity, List<Activity>, (String albumId, String? assetId)>(AlbumActivity.new);

class AlbumActivity extends AutoDisposeFamilyAsyncNotifier<List<Activity>, (String albumId, String? assetId)> {
  late String albumId;
  late String? assetId;

  bool _hasMore = true;
  bool _isLoadingMore = false;

  bool get hasMore => _hasMore;
  bool get isLoadingMore => _isLoadingMore;

  @override
  Future<List<Activity>> build((String albumId, String? assetId) args) async {
    albumId = args.$1;
    assetId = args.$2;
    _hasMore = true;
    _isLoadingMore = false;
    final activities = await ref.watch(activityServiceProvider).getAllActivities(
      albumId,
      assetId: assetId,
      take: _pageSize,
    );
    _hasMore = activities.length >= _pageSize;
    return activities;
  }

  Future<void> loadMore() async {
    final activities = state.valueOrNull;
    if (!_hasMore || _isLoadingMore || activities == null || activities.isEmpty) {
      return;
    }

    _isLoadingMore = true;
    try {
      final older = await ref.watch(activityServiceProvider).getAllActivities(
        albumId,
        assetId: assetId,
        take: _pageSize,
        before: activities.first.createdAt,
      );
      _hasMore = older.length >= _pageSize;
      state = AsyncData([...older, ...activities]);
    } finally {
      _isLoadingMore = false;
    }
  }

  Future<void> removeActivity(String id) async {
    if (await ref.watch(activityServiceProvider).removeActivity(id)) {
      final removedActivity = _removeFromState(id);
      if (removedActivity == null) {
        return;
      }

      if (assetId != null) {
        ref.read(albumActivityProvider((albumId, assetId)).notifier)._removeFromState(id);
      }
    }
  }

  Future<void> addLike() async {
    final activity = await ref.watch(activityServiceProvider).addActivity(albumId, ActivityType.like, assetId: assetId);
    if (activity.hasValue) {
      _addToState(activity.requireValue);
      if (assetId != null) {
        ref.read(albumActivityProvider((albumId, assetId)).notifier)._addToState(activity.requireValue);
      }
    }
  }

  Future<void> addComment(String comment) async {
    final activity = await ref
        .watch(activityServiceProvider)
        .addActivity(albumId, ActivityType.comment, assetId: assetId, comment: comment);

    if (activity.hasValue) {
      _addToState(activity.requireValue);
      if (assetId != null) {
        ref.read(albumActivityProvider((albumId, assetId)).notifier)._addToState(activity.requireValue);
      }
    }
  }

  void _addToState(Activity activity) {
    final activities = state.valueOrNull ?? [];
    if (activities.any((a) => a.id == activity.id)) {
      return;
    }
    state = AsyncData([...activities, activity]);
  }

  Activity? _removeFromState(String id) {
    final activities = state.valueOrNull;
    if (activities == null) {
      return null;
    }
    final activity = activities.firstWhereOrNull((a) => a.id == id);
    if (activity == null) {
      return null;
    }

    final updated = [...activities]..remove(activity);
    state = AsyncData(updated);
    return activity;
  }
}
