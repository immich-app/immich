import 'dart:convert';

import 'package:equatable/equatable.dart';

class ImmichAsset extends Equatable {
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

  const ImmichAsset({
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
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'deviceAssetId': deviceAssetId});
    result.addAll({'userId': userId});
    result.addAll({'deviceId': deviceId});
    result.addAll({'type': type});
    result.addAll({'createdAt': createdAt});
    result.addAll({'modifiedAt': modifiedAt});
    result.addAll({'isFavorite': isFavorite});
    if (duration != null) {
      result.addAll({'duration': duration});
    }
    result.addAll({'originalPath': originalPath});
    result.addAll({'resizePath': resizePath});

    return result;
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

  factory ImmichAsset.fromJson(String source) =>
      ImmichAsset.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ImmichAsset(id: $id, deviceAssetId: $deviceAssetId, userId: $userId, deviceId: $deviceId, type: $type, createdAt: $createdAt, modifiedAt: $modifiedAt, isFavorite: $isFavorite, duration: $duration, originalPath: $originalPath, resizePath: $resizePath)';
  }

  @override
  List<Object> get props {
    return [id];
  }
}
