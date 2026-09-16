import 'dart:convert';
import 'dart:io';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:path/path.dart';

part 'share_intent_attachment.model.freezed.dart';

enum ShareIntentAttachmentType { image, video }

enum UploadStatus { enqueued, running, complete, failed }

@Freezed(fromJson: false, toJson: false, equal: false)
abstract class ShareIntentAttachment with _$ShareIntentAttachment {
  const ShareIntentAttachment._();

  const factory ShareIntentAttachment({
    required String path,
    required ShareIntentAttachmentType type,
    required UploadStatus status,
    @Default(0.0) double uploadProgress,
    @Default(0) int fileLength,
  }) = _ShareIntentAttachment;

  int get id => hash(path);

  File get file => File(path);

  String get fileName => basename(file.path);

  bool get isImage => type == ShareIntentAttachmentType.image;

  bool get isVideo => type == ShareIntentAttachmentType.video;

  String get fileSize => formatHumanReadableBytes(fileLength, 2);

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'path': path,
      'type': type.index,
      'status': status.index,
      'uploadProgress': uploadProgress,
    };
  }

  factory ShareIntentAttachment.fromMap(Map<String, dynamic> map) {
    return ShareIntentAttachment(
      path: map['path'] as String,
      type: ShareIntentAttachmentType.values[map['type'] as int],
      status: UploadStatus.values[map['status'] as int],
      uploadProgress: map['uploadProgress'] as double,
    );
  }

  String toJson() => json.encode(toMap());

  factory ShareIntentAttachment.fromJson(String source) =>
      ShareIntentAttachment.fromMap(json.decode(source) as Map<String, dynamic>);

  // Identity is sourced from the backing file, not from upload progress
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is ShareIntentAttachment && other.path == path && other.type == type;
  }

  @override
  int get hashCode {
    return path.hashCode ^ type.hashCode;
  }
}
