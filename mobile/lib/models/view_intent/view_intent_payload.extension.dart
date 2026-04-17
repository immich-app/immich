import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:path/path.dart';

extension ViewIntentPayloadX on ViewIntentPayload {
  File get file => File(path);

  String get fileName => basename(file.path);

  bool get isImage => type == ViewIntentType.image;

  bool get isVideo => type == ViewIntentType.video;

  AssetPlaybackStyle get playbackStyle {
    if (isVideo) {
      return AssetPlaybackStyle.video;
    }

    final normalizedMimeType = mimeType.toLowerCase();
    if (normalizedMimeType == 'image/gif' || normalizedMimeType == 'image/webp') {
      return AssetPlaybackStyle.imageAnimated;
    }

    final normalizedPath = path.toLowerCase();
    if (normalizedPath.endsWith('.gif') || normalizedPath.endsWith('.webp')) {
      return AssetPlaybackStyle.imageAnimated;
    }

    return AssetPlaybackStyle.image;
  }
}
