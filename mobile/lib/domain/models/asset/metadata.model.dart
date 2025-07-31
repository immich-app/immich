import 'dart:convert';

class AssetMetadata {
  final String? cloudId;

  const AssetMetadata({this.cloudId});

  Map<String, dynamic> toMap() {
    return {
      "metadata": [
        {
          "key": "mobile-app",
          "value": cloudId != null ? {"iCloudId": cloudId} : {},
        },
      ],
    };
  }

  String toJson() => json.encode(toMap());
}
