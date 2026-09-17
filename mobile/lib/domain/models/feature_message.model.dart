import 'package:flutter/foundation.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/utils/semver.dart';

enum FeatureHighlight {
  shareQuality(image: 'assets/feature_message/share_quality.webp'),
  slideshow(image: 'assets/feature_message/slideshow.webp'),
  recentlyAdded(image: 'assets/feature_message/recently_added.webp'),
  ocr(image: 'assets/feature_message/ocr.webp'),
  openInImmich(image: 'assets/feature_message/open_in_immich.webp', platform: [.android]),
  uploadToAlbum();

  /// Asset path of the feature screenshot, or null to show a placeholder.
  final String? image;
  final List<TargetPlatform> platform;

  const FeatureHighlight({this.image, this.platform = const [.iOS, .android]});

  bool get isVisibleOnCurrentPlatform => platform.contains(defaultTargetPlatform);

  String title(Translations t) => switch (this) {
    FeatureHighlight.shareQuality => t.share_quality_title,
    FeatureHighlight.slideshow => t.slideshow_title,
    FeatureHighlight.recentlyAdded => t.recently_added_title,
    FeatureHighlight.ocr => t.ocr_title,
    FeatureHighlight.openInImmich => t.open_in_immich_title,
    FeatureHighlight.uploadToAlbum => t.upload_to_album_title,
  };

  String body(Translations t) => switch (this) {
    FeatureHighlight.shareQuality => t.share_quality_body,
    FeatureHighlight.slideshow => t.slideshow_body,
    FeatureHighlight.recentlyAdded => t.recently_added_body,
    FeatureHighlight.ocr => t.ocr_body,
    FeatureHighlight.openInImmich => t.open_in_immich_body,
    FeatureHighlight.uploadToAlbum => t.upload_to_album_body,
  };
}

/// The release this batch of highlights was authored for. Content-defined:
/// bump it only when publishing a new batch, never from the running app version.
const featureMessageRelease = SemVer(major: 3, minor: 0, patch: 0);

/// Highlights relevant to the current platform.
List<FeatureHighlight> get visibleFeatureMessageHighlights =>
    FeatureHighlight.values.where((h) => h.isVisibleOnCurrentPlatform).toList();
