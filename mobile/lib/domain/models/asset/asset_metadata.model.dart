import 'dart:convert';

enum RemoteAssetMetadataKey {
  mobileApp("mobile-app");

  final String key;

  const RemoteAssetMetadataKey(this.key);

  factory RemoteAssetMetadataKey.fromKey(String key) {
    switch (key) {
      case "mobile-app":
        return RemoteAssetMetadataKey.mobileApp;
      default:
        throw ArgumentError("Unknown AssetMetadataKey key: $key");
    }
  }
}

class RemoteAssetMetadata {
  final String? cloudId;

  const RemoteAssetMetadata({this.cloudId});

  Map<String, dynamic> toMap() {
    final mobileAppValue = {};
    if (cloudId != null) {
      mobileAppValue["iCloudId"] = cloudId;
    }

    return {
      "metadata": [
        {"key": RemoteAssetMetadataKey.mobileApp.key, "value": mobileAppValue},
      ],
    };
  }

  String toJson() => json.encode(toMap());
}
