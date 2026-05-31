// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Stack response
final class StackResponseDto {
  const StackResponseDto({required this.assets, required this.id, required this.primaryAssetId});

  final List<AssetResponseDto> assets;

  /// Stack ID
  final String id;

  /// Primary asset ID
  final String primaryAssetId;

  static StackResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<StackResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assets: ((json[r'assets'] as List?)?.map(($e) => (AssetResponseDto.fromJson($e))!).toList(growable: false))!,
      id: json[r'id'] as String,
      primaryAssetId: json[r'primaryAssetId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assets'] = assets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'id'] = id;
    json[r'primaryAssetId'] = primaryAssetId;
    return json;
  }

  StackResponseDto copyWith({List<AssetResponseDto>? assets, String? id, String? primaryAssetId}) {
    return .new(
      assets: assets ?? this.assets,
      id: id ?? this.id,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is StackResponseDto &&
            const DeepCollectionEquality().equals(assets, other.assets) &&
            id == other.id &&
            primaryAssetId == other.primaryAssetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(assets), id, primaryAssetId]);
  }

  @override
  String toString() => 'StackResponseDto(assets=$assets, id=$id, primaryAssetId=$primaryAssetId)';
}
