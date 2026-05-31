// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataBulkUpsertItemDto {
  const AssetMetadataBulkUpsertItemDto({required this.assetId, required this.key, required this.value});

  /// Asset ID
  final String assetId;

  /// Metadata key
  final String key;

  /// Metadata value (object)
  final Map<String, dynamic> value;

  static AssetMetadataBulkUpsertItemDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataBulkUpsertItemDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      key: json[r'key'] as String,
      value: ((json[r'value'] as Map?)?.cast<String, dynamic>())!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'key'] = key;
    json[r'value'] = value;
    return json;
  }

  AssetMetadataBulkUpsertItemDto copyWith({String? assetId, String? key, Map<String, dynamic>? value}) {
    return .new(assetId: assetId ?? this.assetId, key: key ?? this.key, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataBulkUpsertItemDto &&
            assetId == other.assetId &&
            key == other.key &&
            const DeepCollectionEquality().equals(value, other.value));
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, key, const DeepCollectionEquality().hash(value)]);
  }

  @override
  String toString() => 'AssetMetadataBulkUpsertItemDto(assetId=$assetId, key=$key, value=$value)';
}
