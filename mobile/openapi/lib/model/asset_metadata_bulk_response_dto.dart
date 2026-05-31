// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataBulkResponseDto {
  const AssetMetadataBulkResponseDto({
    required this.assetId,
    required this.key,
    required this.updatedAt,
    required this.value,
  });

  /// Asset ID
  final String assetId;

  /// Metadata key
  final String key;

  /// Last update date
  final DateTime updatedAt;

  /// Metadata value (object)
  final Map<String, dynamic> value;

  static AssetMetadataBulkResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataBulkResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: json[r'assetId'] as String,
      key: json[r'key'] as String,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
      value: ((json[r'value'] as Map?)?.cast<String, dynamic>())!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetId'] = assetId;
    json[r'key'] = key;
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    json[r'value'] = value;
    return json;
  }

  AssetMetadataBulkResponseDto copyWith({
    String? assetId,
    String? key,
    DateTime? updatedAt,
    Map<String, dynamic>? value,
  }) {
    return .new(
      assetId: assetId ?? this.assetId,
      key: key ?? this.key,
      updatedAt: updatedAt ?? this.updatedAt,
      value: value ?? this.value,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataBulkResponseDto &&
            assetId == other.assetId &&
            key == other.key &&
            updatedAt == other.updatedAt &&
            const DeepCollectionEquality().equals(value, other.value));
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, key, updatedAt, const DeepCollectionEquality().hash(value)]);
  }

  @override
  String toString() => 'AssetMetadataBulkResponseDto(assetId=$assetId, key=$key, updatedAt=$updatedAt, value=$value)';
}
