// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataBulkDeleteItemDto {
  const AssetMetadataBulkDeleteItemDto({required this.assetId, required this.key});

  /// Asset ID
  final String assetId;

  /// Metadata key
  final String key;

  static AssetMetadataBulkDeleteItemDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataBulkDeleteItemDto>(value);
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

  AssetMetadataBulkDeleteItemDto copyWith({String? assetId, String? key}) {
    return .new(assetId: assetId ?? this.assetId, key: key ?? this.key);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataBulkDeleteItemDto && assetId == other.assetId && key == other.key);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, key]);
  }

  @override
  String toString() => 'AssetMetadataBulkDeleteItemDto(assetId=$assetId, key=$key)';
}
