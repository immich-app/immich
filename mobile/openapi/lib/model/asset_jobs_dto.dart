// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetJobsDto {
  const AssetJobsDto({required this.assetIds, required this.name});

  /// Asset IDs
  final List<String> assetIds;

  final AssetJobName name;

  static AssetJobsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetJobsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      name: (AssetJobName.fromJson(json[r'name']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    json[r'name'] = name.toJson();
    return json;
  }

  AssetJobsDto copyWith({List<String>? assetIds, AssetJobName? name}) {
    return .new(assetIds: assetIds ?? this.assetIds, name: name ?? this.name);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetJobsDto &&
            const DeepCollectionEquality().equals(assetIds, other.assetIds) &&
            name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds), name]);
  }

  @override
  String toString() => 'AssetJobsDto(assetIds=$assetIds, name=$name)';
}
