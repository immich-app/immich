import 'dart:convert';

class CurrentUploadAsset {
  final String id;
  final DateTime fileCreatedAt;
  final String fileName;
  final String fileType;

  CurrentUploadAsset({
    required this.id,
    required this.fileCreatedAt,
    required this.fileName,
    required this.fileType,
  });

  CurrentUploadAsset copyWith({
    String? id,
    DateTime? fileCreatedAt,
    String? fileName,
    String? fileType,
  }) {
    return CurrentUploadAsset(
      id: id ?? this.id,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'fileCreatedAt': fileCreatedAt.millisecondsSinceEpoch});
    result.addAll({'fileName': fileName});
    result.addAll({'fileType': fileType});

    return result;
  }

  factory CurrentUploadAsset.fromMap(Map<String, dynamic> map) {
    return CurrentUploadAsset(
      id: map['id'] ?? '',
      fileCreatedAt: DateTime.fromMillisecondsSinceEpoch(map['fileCreatedAt']),
      fileName: map['fileName'] ?? '',
      fileType: map['fileType'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory CurrentUploadAsset.fromJson(String source) =>
      CurrentUploadAsset.fromMap(json.decode(source));

  @override
  String toString() {
    return 'CurrentUploadAsset(id: $id, fileCreatedAt: $fileCreatedAt, fileName: $fileName, fileType: $fileType)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CurrentUploadAsset &&
        other.id == id &&
        other.fileCreatedAt == fileCreatedAt &&
        other.fileName == fileName &&
        other.fileType == fileType;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        fileCreatedAt.hashCode ^
        fileName.hashCode ^
        fileType.hashCode;
  }
}
