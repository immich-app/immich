import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_to_date_notifier.provider.dart';

/// Utility functions for timeline navigation
class TimelineUtil {
  /// Scrolls the timeline to the creation date of the given asset
  static void scrollToAssetDate(Asset asset) {
    scrollToDateNotifierProvider.scrollToDate(asset.fileCreatedAt);
  }

  /// Scrolls the timeline to a specific date
  static void scrollToDate(DateTime date) {
    scrollToDateNotifierProvider.scrollToDate(date);
  }
}
