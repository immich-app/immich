import 'dart:convert';

class ImmichAsset {
  final String id;
  final String deviceAssetId;
  final String userId;
  final String deviceId;
  final String assetType;
  final String localPath;
  final String remotePath;
  final String createdAt;
  final String modifiedAt;
  final bool isFavorite;
  final String? description;

  ImmichAsset({
    required this.id,
    required this.deviceAssetId,
    required this.userId,
    required this.deviceId,
    required this.assetType,
    required this.localPath,
    required this.remotePath,
    required this.createdAt,
    required this.modifiedAt,
    required this.isFavorite,
    this.description,
  });

  ImmichAsset copyWith({
    String? id,
    String? deviceAssetId,
    String? userId,
    String? deviceId,
    String? assetType,
    String? localPath,
    String? remotePath,
    String? createdAt,
    String? modifiedAt,
    bool? isFavorite,
    String? description,
  }) {
    return ImmichAsset(
      id: id ?? this.id,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      userId: userId ?? this.userId,
      deviceId: deviceId ?? this.deviceId,
      assetType: assetType ?? this.assetType,
      localPath: localPath ?? this.localPath,
      remotePath: remotePath ?? this.remotePath,
      createdAt: createdAt ?? this.createdAt,
      modifiedAt: modifiedAt ?? this.modifiedAt,
      isFavorite: isFavorite ?? this.isFavorite,
      description: description ?? this.description,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'deviceAssetId': deviceAssetId,
      'userId': userId,
      'deviceId': deviceId,
      'assetType': assetType,
      'localPath': localPath,
      'remotePath': remotePath,
      'createdAt': createdAt,
      'modifiedAt': modifiedAt,
      'isFavorite': isFavorite,
      'description': description,
    };
  }

  factory ImmichAsset.fromMap(Map<String, dynamic> map) {
    return ImmichAsset(
      id: map['id'] ?? '',
      deviceAssetId: map['deviceAssetId'] ?? '',
      userId: map['userId'] ?? '',
      deviceId: map['deviceId'] ?? '',
      assetType: map['assetType'] ?? '',
      localPath: map['localPath'] ?? '',
      remotePath: map['remotePath'] ?? '',
      createdAt: map['createdAt'] ?? '',
      modifiedAt: map['modifiedAt'] ?? '',
      isFavorite: map['isFavorite'] ?? false,
      description: map['description'],
    );
  }

  String toJson() => json.encode(toMap());

  factory ImmichAsset.fromJson(String source) => ImmichAsset.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ImmichAsset(id: $id, deviceAssetId: $deviceAssetId, userId: $userId, deviceId: $deviceId, assetType: $assetType, localPath: $localPath, remotePath: $remotePath, createdAt: $createdAt, modifiedAt: $modifiedAt, isFavorite: $isFavorite, description: $description)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImmichAsset &&
        other.id == id &&
        other.deviceAssetId == deviceAssetId &&
        other.userId == userId &&
        other.deviceId == deviceId &&
        other.assetType == assetType &&
        other.localPath == localPath &&
        other.remotePath == remotePath &&
        other.createdAt == createdAt &&
        other.modifiedAt == modifiedAt &&
        other.isFavorite == isFavorite &&
        other.description == description;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        deviceAssetId.hashCode ^
        userId.hashCode ^
        deviceId.hashCode ^
        assetType.hashCode ^
        localPath.hashCode ^
        remotePath.hashCode ^
        createdAt.hashCode ^
        modifiedAt.hashCode ^
        isFavorite.hashCode ^
        description.hashCode;
  }
}
