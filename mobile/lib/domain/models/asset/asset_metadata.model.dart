enum RemoteAssetMetadataKey {
  mobileApp("mobile-app");

  final String key;

  const RemoteAssetMetadataKey(this.key);
}

abstract class RemoteAssetMetadataValue {
  const RemoteAssetMetadataValue();

  Map<String, dynamic> toJson();
}

class RemoteAssetMetadataItem {
  final RemoteAssetMetadataKey key;
  final RemoteAssetMetadataValue value;

  const RemoteAssetMetadataItem({required this.key, required this.value});

  Map<String, Object?> toJson() {
    return {'key': key.key, 'value': value};
  }
}

class RemoteAssetMobileAppMetadata extends RemoteAssetMetadataValue {
  final String? cloudId;
  final String? createdAt;
  final String? adjustmentTime;
  final String? latitude;
  final String? longitude;

  const RemoteAssetMobileAppMetadata({
    this.cloudId,
    this.createdAt,
    this.adjustmentTime,
    this.latitude,
    this.longitude,
  });

  @override
  Map<String, dynamic> toJson() {
    final map = <String, Object?>{};
    if (cloudId != null) {
      map["iCloudId"] = cloudId;
    }
    if (createdAt != null) {
      map["createdAt"] = createdAt;
    }
    if (adjustmentTime != null) {
      map["adjustmentTime"] = adjustmentTime;
    }
    if (latitude != null) {
      map["latitude"] = latitude;
    }
    if (longitude != null) {
      map["longitude"] = longitude;
    }

    return map;
  }
}
