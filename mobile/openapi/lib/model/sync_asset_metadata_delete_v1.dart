// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetMetadataDeleteV1 {
  const SyncAssetMetadataDeleteV1({required this.assetId, required this.key});

  /// Asset ID
  final String assetId;

  /// Key
  final String key;

  static SyncAssetMetadataDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetMetadataDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetId: json[r'assetId'] as String, key: json[r'key'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'key'] = key;
    return json;
  }

  SyncAssetMetadataDeleteV1 copyWith({String? assetId, String? key}) {
    return .new(assetId: assetId ?? this.assetId, key: key ?? this.key);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAssetMetadataDeleteV1 && assetId == other.assetId && key == other.key);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, key]);
  }

  @override
  String toString() => 'SyncAssetMetadataDeleteV1(assetId=$assetId, key=$key)';
}
