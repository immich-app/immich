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

  const RemoteAssetMobileAppMetadata({this.cloudId});

  @override
  Map<String, dynamic> toJson() {
    final map = <String, Object?>{};
    if (cloudId != null) {
      map["iCloudId"] = cloudId;
    }

    return map;
  }
}
