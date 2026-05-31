// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataUpsertItemDto {
  const AssetMetadataUpsertItemDto({required this.key, required this.value});

  /// Metadata key
  final String key;

  /// Metadata value (object)
  final Map<String, dynamic> value;

  static AssetMetadataUpsertItemDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataUpsertItemDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(key: json[r'key'] as String, value: ((json[r'value'] as Map?)?.cast<String, dynamic>())!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'key'] = key;
    json[r'value'] = value;
    return json;
  }

  AssetMetadataUpsertItemDto copyWith({String? key, Map<String, dynamic>? value}) {
    return .new(key: key ?? this.key, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataUpsertItemDto &&
            key == other.key &&
            const DeepCollectionEquality().equals(value, other.value));
  }

  @override
  int get hashCode {
    return Object.hashAll([key, const DeepCollectionEquality().hash(value)]);
  }

  @override
  String toString() => 'AssetMetadataUpsertItemDto(key=$key, value=$value)';
}
