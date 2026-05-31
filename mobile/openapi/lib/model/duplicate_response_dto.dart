// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class DuplicateResponseDto {
  const DuplicateResponseDto({required this.assets, required this.duplicateId, required this.suggestedKeepAssetIds});

  /// Duplicate assets
  final List<AssetResponseDto> assets;

  /// Duplicate group ID
  final String duplicateId;

  /// Suggested asset IDs to keep based on file size and EXIF data
  final List<String> suggestedKeepAssetIds;

  static DuplicateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<DuplicateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assets: ((json[r'assets'] as List?)?.map(($e) => (AssetResponseDto.fromJson($e))!).toList(growable: false))!,
      duplicateId: json[r'duplicateId'] as String,
      suggestedKeepAssetIds: ((json[r'suggestedKeepAssetIds'] as List?)
          ?.map(($e) => $e as String)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assets'] = assets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'duplicateId'] = duplicateId;
    json[r'suggestedKeepAssetIds'] = suggestedKeepAssetIds;
    return json;
  }

  DuplicateResponseDto copyWith({
    List<AssetResponseDto>? assets,
    String? duplicateId,
    List<String>? suggestedKeepAssetIds,
  }) {
    return .new(
      assets: assets ?? this.assets,
      duplicateId: duplicateId ?? this.duplicateId,
      suggestedKeepAssetIds: suggestedKeepAssetIds ?? this.suggestedKeepAssetIds,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is DuplicateResponseDto &&
            const DeepCollectionEquality().equals(assets, other.assets) &&
            duplicateId == other.duplicateId &&
            const DeepCollectionEquality().equals(suggestedKeepAssetIds, other.suggestedKeepAssetIds));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(assets),
      duplicateId,
      const DeepCollectionEquality().hash(suggestedKeepAssetIds),
    ]);
  }

  @override
  String toString() =>
      'DuplicateResponseDto(assets=$assets, duplicateId=$duplicateId, suggestedKeepAssetIds=$suggestedKeepAssetIds)';
}
