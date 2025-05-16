import 'package:immich_mobile/providers/activity_service.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'activity_statistics.provider.g.dart';

// ignore: unintended_html_in_doc_comment
/// Maintains the current number of comments by <shared-album, asset>
@riverpod
class ActivityStatistics extends _$ActivityStatistics {
  @override
  int build(String albumId, [String? assetId]) {
    ref
        .watch(activityServiceProvider)
        .getStatistics(albumId, assetId: assetId)
        .then((stats) => state = stats.comments);
    return 0;
  }

  void addActivity() => state = state + 1;

  void removeActivity() => state = state - 1;
}

/// Mock class for testing
abstract class ActivityStatisticsInternal extends _$ActivityStatistics {}
