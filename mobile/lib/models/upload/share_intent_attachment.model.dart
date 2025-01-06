// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

enum ShareIntentAttachmentType {
  image,
  video,
}

class ShareIntentAttachment {
  final String path;

  // enum
  final ShareIntentAttachmentType type;
  ShareIntentAttachment({
    required this.path,
    required this.type,
  });

  ShareIntentAttachment copyWith({
    String? path,
    ShareIntentAttachmentType? type,
  }) {
    return ShareIntentAttachment(
      path: path ?? this.path,
      type: type ?? this.type,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'path': path,
      'type': type.index,
    };
  }

  factory ShareIntentAttachment.fromMap(Map<String, dynamic> map) {
    return ShareIntentAttachment(
      path: map['path'] as String,
      type: ShareIntentAttachmentType.values[map['type'] as int],
    );
  }

  String toJson() => json.encode(toMap());

  factory ShareIntentAttachment.fromJson(String source) =>
      ShareIntentAttachment.fromMap(
          json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'ShareIntentAttachment(path: $path, type: $type)';

  @override
  bool operator ==(covariant ShareIntentAttachment other) {
    if (identical(this, other)) return true;

    return other.path == path && other.type == type;
  }

  @override
  int get hashCode => path.hashCode ^ type.hashCode;
}
