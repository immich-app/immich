// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class StackCreateDto {
  const StackCreateDto({required this.assetIds});

  /// Asset IDs (first becomes primary, min 2)
  final List<String> assetIds;

  static StackCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<StackCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(assetIds: ((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetIds'] = assetIds;
    return json;
  }

  StackCreateDto copyWith({List<String>? assetIds}) {
    return .new(assetIds: assetIds ?? this.assetIds);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is StackCreateDto && const DeepCollectionEquality().equals(assetIds, other.assetIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assetIds)]);
  }

  @override
  String toString() => 'StackCreateDto(assetIds=$assetIds)';
}
