import 'dart:ui';

const double kTimelineHeaderExtent = 80.0;
const Size kTimelineFixedTileExtent = Size.square(256);
const double kTimelineSpacing = 2.0;
const int kTimelineColumnCount = 3;

const double kScrubberThumbHeight = 48.0;
const Duration kTimelineScrubberFadeInDuration = Duration(milliseconds: 300);
const Duration kTimelineScrubberFadeOutDuration = Duration(milliseconds: 800);

const Size kThumbnailResolution = Size.square(320);
const kThumbnailDiskCacheSize = 1024 << 20; // 1GiB

Size getThumbnailResolution(Size size, double pixelRatio) {
  final width = size.width * pixelRatio;
  final height = size.height * pixelRatio;
  if (!width.isFinite || !height.isFinite || width <= 0 || height <= 0) {
    return Size.zero;
  }

  return Size(width.ceilToDouble(), height.ceilToDouble());
}
