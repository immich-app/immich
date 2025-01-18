// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';
import 'dart:io';

import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:path/path.dart';

enum ShareIntentAttachmentType {
  image,
  video,
}

enum UploadStatus {
  enqueued,
  running,
  complete,
  notFound,
  failed,
  canceled,
  waitingtoRetry,
  paused,
}

class ShareIntentAttachment {
  final String path;

  // enum
  final ShareIntentAttachmentType type;

  // enum
  final UploadStatus status;

  final double uploadProgress;

  final int fileLength;

  ShareIntentAttachment({
    required this.path,
    required this.type,
    required this.status,
    this.uploadProgress = 0,
    this.fileLength = 0,
  });

  int get id => hash(path);

  File get file => File(path);

  String get fileName => basename(file.path);

  bool get isImage => type == ShareIntentAttachmentType.image;

  bool get isVideo => type == ShareIntentAttachmentType.video;

  String? _fileSize;

  String get fileSize => _fileSize ??= formatHumanReadableBytes(fileLength, 2);

  ShareIntentAttachment copyWith({
    String? path,
    ShareIntentAttachmentType? type,
    UploadStatus? status,
    double? uploadProgress,
  }) {
    return ShareIntentAttachment(
      path: path ?? this.path,
      type: type ?? this.type,
      status: status ?? this.status,
      uploadProgress: uploadProgress ?? this.uploadProgress,
    );
  }

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
      ShareIntentAttachment.fromMap(
        json.decode(source) as Map<String, dynamic>,
      );

  @override
  String toString() {
    return 'ShareIntentAttachment(path: $path, type: $type, status: $status, uploadProgress: $uploadProgress)';
  }

  @override
  bool operator ==(covariant ShareIntentAttachment other) {
    if (identical(this, other)) return true;

    return other.path == path && other.type == type;
  }

  @override
  int get hashCode {
    return path.hashCode ^ type.hashCode;
  }
}
