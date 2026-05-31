// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetFaceUpdateItem {
  const AssetFaceUpdateItem({required this.assetId, required this.personId});

  /// Asset ID
  final String assetId;

  /// Person ID
  final String personId;

  static AssetFaceUpdateItem? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetFaceUpdateItem>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetId: json[r'assetId'] as String, personId: json[r'personId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'personId'] = personId;
    return json;
  }

  AssetFaceUpdateItem copyWith({String? assetId, String? personId}) {
    return .new(assetId: assetId ?? this.assetId, personId: personId ?? this.personId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetFaceUpdateItem && assetId == other.assetId && personId == other.personId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, personId]);
  }

  @override
  String toString() => 'AssetFaceUpdateItem(assetId=$assetId, personId=$personId)';
}
