import 'package:flutter/foundation.dart';

class FeatureHighlight {
  /// Asset path of the feature screenshot, or null to show a placeholder.
  final String? image;
  final String titleKey;
  final String bodyKey;
  final List<TargetPlatform> platform;

  const FeatureHighlight({
    this.image,
    required this.titleKey,
    required this.bodyKey,
    this.platform = const [.iOS, .android],
  });

  bool get isVisibleOnCurrentPlatform => platform.contains(defaultTargetPlatform);
}

const int featureMessageHighlightVersion = 1;

const String featureMessageReleaseLabel = '3.0.0';

/// Highlights relevant to the current platform.
List<FeatureHighlight> get visibleFeatureMessageHighlights =>
    featureMessageHighlights.where((h) => h.isVisibleOnCurrentPlatform).toList();

const List<FeatureHighlight> featureMessageHighlights = [
  FeatureHighlight(
    image: 'assets/feature_message/share_quality.webp',
    titleKey: 'share_quality_title',
    bodyKey: 'share_quality_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/slideshow.webp',
    titleKey: 'slideshow_title',
    bodyKey: 'slideshow_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/recently_added.webp',
    titleKey: 'recently_added_title',
    bodyKey: 'recently_added_body',
  ),

  FeatureHighlight(image: 'assets/feature_message/ocr.webp', titleKey: 'ocr_title', bodyKey: 'ocr_body'),
  FeatureHighlight(
    image: 'assets/feature_message/open_in_immich.webp',
    titleKey: 'open_in_immich_title',
    bodyKey: 'open_in_immich_body',
    platform: [.android],
  ),
  FeatureHighlight(titleKey: 'upload_to_album_title', bodyKey: 'upload_to_album_body'),
];
