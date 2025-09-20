import 'dart:ui';

const double kTimelineHeaderExtent = 80.0;
const Size kTimelineFixedTileExtent = Size.square(256);
const double kTimelineSpacing = 2.0;
const int kTimelineColumnCount = 3;

const Duration kTimelineScrubberFadeInDuration = Duration(milliseconds: 300);
const Duration kTimelineScrubberFadeOutDuration = Duration(milliseconds: 800);

const Size kThumbnailResolution = Size.square(320); // TODO: make the resolution vary based on actual tile size
const kThumbnailDiskCacheSize = 1024 << 20; // 1GiB
