// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagBulkAssetsResponseDto {
  const TagBulkAssetsResponseDto({required this.count});

  /// Number of assets tagged
  final int count;

  static TagBulkAssetsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagBulkAssetsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(count: json[r'count'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    return json;
  }

  TagBulkAssetsResponseDto copyWith({int? count}) {
    return .new(count: count ?? this.count);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TagBulkAssetsResponseDto && count == other.count);
  }

  @override
  int get hashCode {
    return Object.hashAll([count]);
  }

  @override
  String toString() => 'TagBulkAssetsResponseDto(count=$count)';
}
