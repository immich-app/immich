// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetDeleteV1 {
  const SyncAssetDeleteV1({required this.assetId});

  /// Asset ID
  final String assetId;

  static SyncAssetDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetId: json[r'assetId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    return json;
  }

  SyncAssetDeleteV1 copyWith({String? assetId}) {
    return .new(assetId: assetId ?? this.assetId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAssetDeleteV1 && assetId == other.assetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId]);
  }

  @override
  String toString() => 'SyncAssetDeleteV1(assetId=$assetId)';
}
