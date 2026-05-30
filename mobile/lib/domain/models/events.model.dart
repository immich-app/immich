import 'package:immich_mobile/domain/utils/event_stream.dart';

// Timeline Events
class TimelineReloadEvent extends Event {
  const TimelineReloadEvent();
}

class ScrollToTopEvent extends Event {
  const ScrollToTopEvent();
}

class ScrollToDateEvent extends Event {
  final DateTime date;

  const ScrollToDateEvent(this.date);
}

/// Emitted when a tile is tapped in the dense zoomed-out layout: instead of
/// opening the asset, the timeline zooms in one stop centered on this asset.
/// Modeled as an event (not a direct callback) so the tile widget — which lives
/// deep inside the sliver list — doesn't need a reference to the timeline's
/// gesture/zoom state, mirroring how [ScrollToDateEvent] decouples scrubber
/// taps from the timeline.
class TimelineZoomToAssetEvent extends Event {
  final int assetIndex;

  const TimelineZoomToAssetEvent(this.assetIndex);
}

// Asset Viewer Events
class ViewerShowDetailsEvent extends Event {
  const ViewerShowDetailsEvent();
}

class ViewerReloadAssetEvent extends Event {
  const ViewerReloadAssetEvent();
}

// Multi-Select Events
class MultiSelectToggleEvent extends Event {
  final bool isEnabled;
  const MultiSelectToggleEvent(this.isEnabled);
}

// Map Events
class MapMarkerReloadEvent extends Event {
  const MapMarkerReloadEvent();
}
