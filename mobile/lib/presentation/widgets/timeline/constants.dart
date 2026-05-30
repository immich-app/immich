import 'dart:ui';

const double kTimelineHeaderExtent = 80.0;
const Size kTimelineFixedTileExtent = Size.square(256);
const double kTimelineSpacing = 2.0;
const int kTimelineColumnCount = 3;

/// Absolute bounds for the number of asset tiles per row reachable by pinch.
const int kTimelineMinColumnCount = 1;
const int kTimelineMaxColumnCount = 32;

/// Manual "assets per row" slider range (the normal grid). The wider zoom-out
/// levels (month/year-like) are reached only by pinch / the No-grouping layout.
const int kTimelineSliderMinColumnCount = 1;
const int kTimelineSliderMaxColumnCount = 6;

/// Discrete zoom stops the pinch snaps to and that tap-zoom steps through.
/// Even counts (so an equal number of columns can be added to each side of the
/// focal asset when zooming), plus a single-image-wide level.
const List<int> kTimelineZoomStops = [1, 2, 4, 6, 16, 32];

/// Densest grouped (day/month) level before pinching further switches the
/// timeline into the continuous "No grouping" layout.
const int kTimelineGroupedMaxColumnCount = 6;

/// Floating date-label granularity boundaries in No-grouping mode: at or below
/// [kTimelineGroupedMaxColumnCount] columns shows a day, up to this shows a
/// month, and wider shows a year.
const int kTimelineMonthLabelMaxColumns = 16;

const double kScrubberThumbHeight = 48.0;
const Duration kTimelineScrubberFadeInDuration = Duration(milliseconds: 300);
const Duration kTimelineScrubberFadeOutDuration = Duration(milliseconds: 800);

/// Default (and maximum) thumbnail decode edge, in pixels. Used for every
/// non-timeline caller and as the cap for the per-tile decode size below.
const Size kThumbnailResolution = Size.square(320);

/// Physical-pixel decode edges that timeline tiles snap up to. Decoding a tiny
/// tile (a dense zoom level) at a small edge keeps its GPU texture and decode
/// cost proportional to what is actually shown, instead of always decoding the
/// full [kThumbnailResolution]. Capped at [kThumbnailResolution] so a tile is
/// never decoded larger than the previous fixed size (no regression for the
/// coarse, large-tile levels).
const List<int> kThumbnailDecodeStops = [48, 96, 256];

/// Thumbnails decoded at or below this edge (the dense zoom-out levels) are routed
/// to a dedicated high-count image-cache tier, so a screenful of hundreds of tiny
/// tiles can't evict the normal-size thumbnails — and vice-versa.
const int kTinyThumbnailMaxEdge = 128;

/// Snaps a tile's displayed edge (logical px × [devicePixelRatio]) up to a
/// [kThumbnailDecodeStops] bucket, falling back to the full [kThumbnailResolution]
/// edge for large tiles. Bucketing avoids fragmenting the image cache across
/// slightly different tile sizes.
int thumbnailDecodeEdge(double tileExtentLogical, double devicePixelRatio) {
  final physical = tileExtentLogical * devicePixelRatio;
  for (final stop in kThumbnailDecodeStops) {
    if (physical <= stop) {
      return stop;
    }
  }
  return kThumbnailResolution.width.toInt();
}

const kThumbnailDiskCacheSize = 1024 << 20; // 1GiB
