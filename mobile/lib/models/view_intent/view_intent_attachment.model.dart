import 'dart:io';

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:path/path.dart';

enum ViewIntentAttachmentType { image, video }

class ViewIntentAttachment {
  final String path;
  final ViewIntentAttachmentType type;
  final String mimeType;
  final String? localAssetId;

  const ViewIntentAttachment({
    required this.path,
    required this.type,
    required this.mimeType,
    this.localAssetId,
  });

  File get file => File(path);

  String get fileName => basename(file.path);

  bool get isImage => type == ViewIntentAttachmentType.image;

  bool get isVideo => type == ViewIntentAttachmentType.video;

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
