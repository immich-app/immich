import 'dart:io';

import 'package:path/path.dart';

enum ViewIntentAttachmentType { image, video }

class ViewIntentAttachment {
  final String path;
  final ViewIntentAttachmentType type;
  final String? localAssetId;

  const ViewIntentAttachment({required this.path, required this.type, this.localAssetId});

  File get file => File(path);

  String get fileName => basename(file.path);

  bool get isImage => type == ViewIntentAttachmentType.image;

  bool get isVideo => type == ViewIntentAttachmentType.video;
}
