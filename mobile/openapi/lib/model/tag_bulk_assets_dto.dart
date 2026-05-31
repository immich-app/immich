// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagBulkAssetsDto {
  const TagBulkAssetsDto({required this.assetIds, required this.tagIds});

  /// Asset IDs
  final List<String> assetIds;

  /// Tag IDs
  final List<String> tagIds;

  static TagBulkAssetsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagBulkAssetsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      tagIds: ((json[r'tagIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    json[r'tagIds'] = tagIds;
    return json;
  }

  TagBulkAssetsDto copyWith({List<String>? assetIds, List<String>? tagIds}) {
    return .new(assetIds: assetIds ?? this.assetIds, tagIds: tagIds ?? this.tagIds);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TagBulkAssetsDto &&
            const DeepCollectionEquality().equals(assetIds, other.assetIds) &&
            const DeepCollectionEquality().equals(tagIds, other.tagIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds), const DeepCollectionEquality().hash(tagIds)]);
  }

  @override
  String toString() => 'TagBulkAssetsDto(assetIds=$assetIds, tagIds=$tagIds)';
}
