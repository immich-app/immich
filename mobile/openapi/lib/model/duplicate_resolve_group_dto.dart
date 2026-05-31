// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DuplicateResolveGroupDto {
  const DuplicateResolveGroupDto({required this.duplicateId, required this.keepAssetIds, required this.trashAssetIds});

  final String duplicateId;

  /// Asset IDs to keep
  final List<String> keepAssetIds;

  /// Asset IDs to trash or delete
  final List<String> trashAssetIds;

  static DuplicateResolveGroupDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DuplicateResolveGroupDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      duplicateId: json[r'duplicateId'] as String,
      keepAssetIds: ((json[r'keepAssetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      trashAssetIds: ((json[r'trashAssetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'duplicateId'] = duplicateId;
    json[r'keepAssetIds'] = keepAssetIds;
    json[r'trashAssetIds'] = trashAssetIds;
    return json;
  }

  DuplicateResolveGroupDto copyWith({String? duplicateId, List<String>? keepAssetIds, List<String>? trashAssetIds}) {
    return .new(
      duplicateId: duplicateId ?? this.duplicateId,
      keepAssetIds: keepAssetIds ?? this.keepAssetIds,
      trashAssetIds: trashAssetIds ?? this.trashAssetIds,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DuplicateResolveGroupDto &&
            duplicateId == other.duplicateId &&
            const DeepCollectionEquality().equals(keepAssetIds, other.keepAssetIds) &&
            const DeepCollectionEquality().equals(trashAssetIds, other.trashAssetIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      duplicateId,
      const DeepCollectionEquality().hash(keepAssetIds),
      const DeepCollectionEquality().hash(trashAssetIds),
    ]);
  }

  @override
  String toString() =>
      'DuplicateResolveGroupDto(duplicateId=$duplicateId, keepAssetIds=$keepAssetIds, trashAssetIds=$trashAssetIds)';
}
