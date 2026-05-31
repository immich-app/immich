// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumsAddAssetsDto {
  const AlbumsAddAssetsDto({required this.albumIds, required this.assetIds});

  /// Album IDs
  final List<String> albumIds;

  /// Asset IDs
  final List<String> assetIds;

  static AlbumsAddAssetsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumsAddAssetsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumIds: ((json[r'albumIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumIds'] = albumIds;
    json[r'assetIds'] = assetIds;
    return json;
  }

  AlbumsAddAssetsDto copyWith({List<String>? albumIds, List<String>? assetIds}) {
    return .new(albumIds: albumIds ?? this.albumIds, assetIds: assetIds ?? this.assetIds);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AlbumsAddAssetsDto &&
            const DeepCollectionEquality().equals(albumIds, other.albumIds) &&
            const DeepCollectionEquality().equals(assetIds, other.assetIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(albumIds),
      const DeepCollectionEquality().hash(assetIds),
    ]);
  }

  @override
  String toString() => 'AlbumsAddAssetsDto(albumIds=$albumIds, assetIds=$assetIds)';
}
