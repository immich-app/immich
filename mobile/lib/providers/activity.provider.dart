import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/providers/activity_service.provider.dart';

// ignore: unintended_html_in_doc_comment
/// Maintains the current list of all activities for <share-album-id, asset>

final albumActivityProvider = AsyncNotifierProvider.autoDispose
    .family<AlbumActivity, List<Activity>, (String albumId, String? assetId)>(AlbumActivity.new);

class AlbumActivity extends AutoDisposeFamilyAsyncNotifier<List<Activity>, (String albumId, String? assetId)> {
  late String albumId;
  late String? assetId;

  @override
  Future<List<Activity>> build((String albumId, String? assetId) args) async {
    albumId = args.$1;
    assetId = args.$2;
    return ref.watch(activityServiceProvider).getAllActivities(albumId, assetId: assetId);
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
