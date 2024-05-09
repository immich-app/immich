// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

class CurrentUploadAsset {
  final String id;
  final DateTime fileCreatedAt;
  final String fileName;
  final String fileType;
  final int? fileSize;
  final bool? iCloudAsset;

  CurrentUploadAsset({
    required this.id,
    required this.fileCreatedAt,
    required this.fileName,
    required this.fileType,
    this.fileSize,
    this.iCloudAsset,
  });

  CurrentUploadAsset copyWith({
    String? id,
    DateTime? fileCreatedAt,
    String? fileName,
    String? fileType,
    int? fileSize,
    bool? iCloudAsset,
  }) {
    return CurrentUploadAsset(
      id: id ?? this.id,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
      fileSize: fileSize ?? this.fileSize,
      iCloudAsset: iCloudAsset ?? this.iCloudAsset,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'fileCreatedAt': fileCreatedAt.millisecondsSinceEpoch,
      'fileName': fileName,
      'fileType': fileType,
      'fileSize': fileSize,
      'iCloudAsset': iCloudAsset,
    };
  }

  factory CurrentUploadAsset.fromMap(Map<String, dynamic> map) {
    return CurrentUploadAsset(
      id: map['id'] as String,
      fileCreatedAt:
          DateTime.fromMillisecondsSinceEpoch(map['fileCreatedAt'] as int),
      fileName: map['fileName'] as String,
      fileType: map['fileType'] as String,
      fileSize: map['fileSize'] as int,
      iCloudAsset:
          map['iCloudAsset'] != null ? map['iCloudAsset'] as bool : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory CurrentUploadAsset.fromJson(String source) =>
      CurrentUploadAsset.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'CurrentUploadAsset(id: $id, fileCreatedAt: $fileCreatedAt, fileName: $fileName, fileType: $fileType, fileSize: $fileSize, iCloudAsset: $iCloudAsset)';
  }

  @override
  bool operator ==(covariant CurrentUploadAsset other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.fileCreatedAt == fileCreatedAt &&
        other.fileName == fileName &&
        other.fileType == fileType &&
        other.fileSize == fileSize &&
        other.iCloudAsset == iCloudAsset;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        fileCreatedAt.hashCode ^
        fileName.hashCode ^
        fileType.hashCode ^
        fileSize.hashCode ^
        iCloudAsset.hashCode;
  }
}
