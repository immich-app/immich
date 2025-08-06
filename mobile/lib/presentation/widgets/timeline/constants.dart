import 'dart:ui';

const double kTimelineHeaderExtent = 80.0;
const Size kTimelineFixedTileExtent = Size.square(256);
const Size kThumbnailResolution = kTimelineFixedTileExtent;
const double kTimelineSpacing = 2.0;
const int kTimelineColumnCount = 3;

const Duration kTimelineScrubberFadeInDuration = Duration(milliseconds: 300);
const Duration kTimelineScrubberFadeOutDuration = Duration(milliseconds: 800);
