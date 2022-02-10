import 'dart:convert';

import 'package:immich_mobile/shared/models/exif.model.dart';

class ImmichAssetWithExif {
  final String id;
  final String deviceAssetId;
  final String userId;
  final String deviceId;
  final String type;
  final String createdAt;
  final String modifiedAt;
  final bool isFavorite;
  final String? duration;
  final ImmichExif? exifInfo;

  ImmichAssetWithExif({
    required this.id,
    required this.deviceAssetId,
    required this.userId,
    required this.deviceId,
    required this.type,
    required this.createdAt,
    required this.modifiedAt,
    required this.isFavorite,
    this.duration,
    this.exifInfo,
  });

  ImmichAssetWithExif copyWith({
    String? id,
    String? deviceAssetId,
    String? userId,
    String? deviceId,
    String? type,
    String? createdAt,
    String? modifiedAt,
    bool? isFavorite,
    String? duration,
    ImmichExif? exifInfo,
  }) {
    return ImmichAssetWithExif(
      id: id ?? this.id,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      userId: userId ?? this.userId,
      deviceId: deviceId ?? this.deviceId,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      modifiedAt: modifiedAt ?? this.modifiedAt,
      isFavorite: isFavorite ?? this.isFavorite,
      duration: duration ?? this.duration,
      exifInfo: exifInfo ?? this.exifInfo,
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
      'exifInfo': exifInfo?.toMap(),
    };
  }

  factory ImmichAssetWithExif.fromMap(Map<String, dynamic> map) {
    return ImmichAssetWithExif(
      id: map['id'] ?? '',
      deviceAssetId: map['deviceAssetId'] ?? '',
      userId: map['userId'] ?? '',
      deviceId: map['deviceId'] ?? '',
      type: map['type'] ?? '',
      createdAt: map['createdAt'] ?? '',
      modifiedAt: map['modifiedAt'] ?? '',
      isFavorite: map['isFavorite'] ?? false,
      duration: map['duration'],
      exifInfo: map['exifInfo'] != null ? ImmichExif.fromMap(map['exifInfo']) : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory ImmichAssetWithExif.fromJson(String source) => ImmichAssetWithExif.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ImmichAssetWithExif(id: $id, deviceAssetId: $deviceAssetId, userId: $userId, deviceId: $deviceId, type: $type, createdAt: $createdAt, modifiedAt: $modifiedAt, isFavorite: $isFavorite, duration: $duration, exifInfo: $exifInfo)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImmichAssetWithExif &&
        other.id == id &&
        other.deviceAssetId == deviceAssetId &&
        other.userId == userId &&
        other.deviceId == deviceId &&
        other.type == type &&
        other.createdAt == createdAt &&
        other.modifiedAt == modifiedAt &&
        other.isFavorite == isFavorite &&
        other.duration == duration &&
        other.exifInfo == exifInfo;
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
        exifInfo.hashCode;
  }
}
