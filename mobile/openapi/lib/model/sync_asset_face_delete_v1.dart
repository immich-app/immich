// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetFaceDeleteV1 {
  const SyncAssetFaceDeleteV1({required this.assetFaceId});

  /// Asset face ID
  final String assetFaceId;

  static SyncAssetFaceDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetFaceDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetFaceId: json[r'assetFaceId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetFaceId'] = assetFaceId;
    return json;
  }

  SyncAssetFaceDeleteV1 copyWith({String? assetFaceId}) {
    return .new(assetFaceId: assetFaceId ?? this.assetFaceId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAssetFaceDeleteV1 && assetFaceId == other.assetFaceId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetFaceId]);
  }

  @override
  String toString() => 'SyncAssetFaceDeleteV1(assetFaceId=$assetFaceId)';
}
