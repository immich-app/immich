// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMetadataResponseDto {
  const AssetMetadataResponseDto({required this.key, required this.updatedAt, required this.value});

  /// Metadata key
  final String key;

  /// Last update date
  final DateTime updatedAt;

  /// Metadata value (object)
  final Map<String, dynamic> value;

  static AssetMetadataResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMetadataResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      key: json[r'key'] as String,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
      value: ((json[r'value'] as Map?)?.cast<String, dynamic>())!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'key'] = key;
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    json[r'value'] = value;
    return json;
  }

  AssetMetadataResponseDto copyWith({String? key, DateTime? updatedAt, Map<String, dynamic>? value}) {
    return .new(key: key ?? this.key, updatedAt: updatedAt ?? this.updatedAt, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMetadataResponseDto &&
            key == other.key &&
            updatedAt == other.updatedAt &&
            const DeepCollectionEquality().equals(value, other.value));
  }

  @override
  int get hashCode {
    return Object.hashAll([key, updatedAt, const DeepCollectionEquality().hash(value)]);
  }

  @override
  String toString() => 'AssetMetadataResponseDto(key=$key, updatedAt=$updatedAt, value=$value)';
}
