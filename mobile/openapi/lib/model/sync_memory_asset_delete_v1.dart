// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncMemoryAssetDeleteV1 {
  const SyncMemoryAssetDeleteV1({required this.assetId, required this.memoryId});

  /// Asset ID
  final String assetId;

  /// Memory ID
  final String memoryId;

  static SyncMemoryAssetDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncMemoryAssetDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetId: json[r'assetId'] as String, memoryId: json[r'memoryId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'memoryId'] = memoryId;
    return json;
  }

  SyncMemoryAssetDeleteV1 copyWith({String? assetId, String? memoryId}) {
    return .new(assetId: assetId ?? this.assetId, memoryId: memoryId ?? this.memoryId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncMemoryAssetDeleteV1 && assetId == other.assetId && memoryId == other.memoryId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, memoryId]);
  }

  @override
  String toString() => 'SyncMemoryAssetDeleteV1(assetId=$assetId, memoryId=$memoryId)';
}
