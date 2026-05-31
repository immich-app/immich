// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetIdsDto {
  const AssetIdsDto({required this.assetIds});

  /// Asset IDs
  final List<String> assetIds;

  static AssetIdsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetIdsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    return json;
  }

  AssetIdsDto copyWith({List<String>? assetIds}) {
    return .new(assetIds: assetIds ?? this.assetIds);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetIdsDto && const DeepCollectionEquality().equals(assetIds, other.assetIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds)]);
  }

  @override
  String toString() => 'AssetIdsDto(assetIds=$assetIds)';
}
