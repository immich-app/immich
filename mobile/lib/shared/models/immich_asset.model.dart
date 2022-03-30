import 'dart:convert';

class ImmichAsset {
  final String id;
  final String deviceAssetId;
  final String userId;
  final String deviceId;
  final String type;
  final String createdAt;
  final String modifiedAt;
  final bool isFavorite;
  final String? duration;
  final String originalPath;
  final String resizePath;

  ImmichAsset({
    required this.id,
    required this.deviceAssetId,
    required this.userId,
    required this.deviceId,
    required this.type,
    required this.createdAt,
    required this.modifiedAt,
    required this.isFavorite,
    this.duration,
    required this.originalPath,
    required this.resizePath,
  });

  ImmichAsset copyWith({
    String? id,
    String? deviceAssetId,
    String? userId,
    String? deviceId,
    String? type,
    String? createdAt,
    String? modifiedAt,
    bool? isFavorite,
    String? duration,
    String? originalPath,
    String? resizePath,
  }) {
    return ImmichAsset(
      id: id ?? this.id,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      userId: userId ?? this.userId,
      deviceId: deviceId ?? this.deviceId,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      modifiedAt: modifiedAt ?? this.modifiedAt,
      isFavorite: isFavorite ?? this.isFavorite,
      duration: duration ?? this.duration,
      originalPath: originalPath ?? this.originalPath,
      resizePath: resizePath ?? this.resizePath,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'deviceAssetId': deviceAssetId,
      'userId': userId,
      'deviceId': deviceId,
      'type': type,
      'createdAt': createdAt,
      'modifiedAt': modifiedAt,
      'isFavorite': isFavorite,
      'duration': duration,
      'originalPath': originalPath,
      'resizePath': resizePath,
    };
  }

  factory ImmichAsset.fromMap(Map<String, dynamic> map) {
    return ImmichAsset(
      id: map['id'] ?? '',
      deviceAssetId: map['deviceAssetId'] ?? '',
      userId: map['userId'] ?? '',
      deviceId: map['deviceId'] ?? '',
      type: map['type'] ?? '',
      createdAt: map['createdAt'] ?? '',
      modifiedAt: map['modifiedAt'] ?? '',
      isFavorite: map['isFavorite'] ?? false,
      duration: map['duration'],
      originalPath: map['originalPath'] ?? '',
      resizePath: map['resizePath'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory ImmichAsset.fromJson(String source) => ImmichAsset.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ImmichAsset(id: $id, deviceAssetId: $deviceAssetId, userId: $userId, deviceId: $deviceId, type: $type, createdAt: $createdAt, modifiedAt: $modifiedAt, isFavorite: $isFavorite, duration: $duration, originalPath: $originalPath, resizePath: $resizePath)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImmichAsset &&
        other.id == id &&
        other.deviceAssetId == deviceAssetId &&
        other.userId == userId &&
        other.deviceId == deviceId &&
        other.type == type &&
        other.createdAt == createdAt &&
        other.modifiedAt == modifiedAt &&
        other.isFavorite == isFavorite &&
        other.duration == duration &&
        other.originalPath == originalPath &&
        other.resizePath == resizePath;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        deviceAssetId.hashCode ^
        userId.hashCode ^
        deviceId.hashCode ^
        type.hashCode ^
        createdAt.hashCode ^
        modifiedAt.hashCode ^
        isFavorite.hashCode ^
        duration.hashCode ^
        originalPath.hashCode ^
        resizePath.hashCode;
  }
}
