class FeatureHighlight {
  final String image;
  final String titleKey;
  final String bodyKey;

  const FeatureHighlight({required this.image, required this.titleKey, required this.bodyKey});
}

const int featureMessageHighlightVersion = 1;

const String featureMessageReleaseLabel = '3.0.0';

const List<FeatureHighlight> featureMessageHighlights = [
  FeatureHighlight(
    image: 'assets/feature_message/share_quality.webp',
    titleKey: 'feature_message_share_quality_title',
    bodyKey: 'feature_message_share_quality_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/slideshow.webp',
    titleKey: 'feature_message_slideshow_title',
    bodyKey: 'feature_message_slideshow_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/recently_added.webp',
    titleKey: 'feature_message_recently_added_title',
    bodyKey: 'feature_message_recently_added_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/non_destructive_editing.webp',
    titleKey: 'feature_message_non_destructive_editing_title',
    bodyKey: 'feature_message_non_destructive_editing_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/ocr.webp',
    titleKey: 'feature_message_ocr_title',
    bodyKey: 'feature_message_ocr_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/open_in_immich.webp',
    titleKey: 'feature_message_open_in_immich_title',
    bodyKey: 'feature_message_open_in_immich_body',
  ),
  FeatureHighlight(
    image: 'assets/feature_message/upload_to_album.webp',
    titleKey: 'feature_message_upload_to_album_title',
    bodyKey: 'feature_message_upload_to_album_body',
  ),
];
