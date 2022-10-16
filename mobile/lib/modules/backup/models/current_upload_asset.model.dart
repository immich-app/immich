import 'dart:convert';

class CurrentUploadAsset {
  final String id;
  final String deviceId;
  final DateTime createdAt;
  final String fileName;
  final String fileType;

  CurrentUploadAsset({
    required this.id,
    required this.deviceId,
    required this.createdAt,
    required this.fileName,
    required this.fileType,
  });

  CurrentUploadAsset copyWith({
    String? id,
    String? deviceId,
    DateTime? createdAt,
    String? fileName,
    String? fileType,
  }) {
    return CurrentUploadAsset(
      id: id ?? this.id,
      deviceId: deviceId ?? this.deviceId,
      createdAt: createdAt ?? this.createdAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'deviceId': deviceId});
    result.addAll({'createdAt': createdAt.millisecondsSinceEpoch});
    result.addAll({'fileName': fileName});
    result.addAll({'fileType': fileType});

    return result;
  }

  factory CurrentUploadAsset.fromMap(Map<String, dynamic> map) {
    return CurrentUploadAsset(
      id: map['id'] ?? '',
      deviceId: map['deviceId'] ?? '',
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt']),
      fileName: map['fileName'] ?? '',
      fileType: map['fileType'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory CurrentUploadAsset.fromJson(String source) =>
      CurrentUploadAsset.fromMap(json.decode(source));

  @override
  String toString() {
    return 'CurrentUploadAsset(id: $id, deviceId: $deviceId, createdAt: $createdAt, fileName: $fileName, fileType: $fileType)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CurrentUploadAsset &&
        other.id == id &&
        other.deviceId == deviceId &&
        other.createdAt == createdAt &&
        other.fileName == fileName &&
        other.fileType == fileType;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        deviceId.hashCode ^
        createdAt.hashCode ^
        fileName.hashCode ^
        fileType.hashCode;
  }
}
