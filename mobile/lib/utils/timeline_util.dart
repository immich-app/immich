import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

class ScrollToTopEvent extends Event {
  const ScrollToTopEvent();
}

class ScrollToDateEvent extends Event {
  final DateTime date;

  const ScrollToDateEvent(this.date);
}

class TimelineUtil {
  /// Scrolls the timeline to a specific asset's date
  static void scrollToAssetDate(Asset asset) {
    EventStream.shared.emit(ScrollToDateEvent(asset.fileCreatedAt));
  }

  /// Scrolls the timeline to a specific date
  static void scrollToDate(DateTime date) {
    EventStream.shared.emit(ScrollToDateEvent(date));
  }

  /// Scrolls the timeline to the top
  static void scrollToTop() {
    EventStream.shared.emit(const ScrollToTopEvent());
  }
}
