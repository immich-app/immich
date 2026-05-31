// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetStackResponseDto {
  const AssetStackResponseDto({required this.assetCount, required this.id, required this.primaryAssetId});

  /// Number of assets in stack
  final int assetCount;

  /// Stack ID
  final String id;

  /// Primary asset ID
  final String primaryAssetId;

  static AssetStackResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetStackResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetCount: json[r'assetCount'] as int,
      id: json[r'id'] as String,
      primaryAssetId: json[r'primaryAssetId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetCount'] = assetCount;
    json[r'id'] = id;
    json[r'primaryAssetId'] = primaryAssetId;
    return json;
  }

  AssetStackResponseDto copyWith({int? assetCount, String? id, String? primaryAssetId}) {
    return .new(
      assetCount: assetCount ?? this.assetCount,
      id: id ?? this.id,
      primaryAssetId: primaryAssetId ?? this.primaryAssetId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetStackResponseDto &&
            assetCount == other.assetCount &&
            id == other.id &&
            primaryAssetId == other.primaryAssetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetCount, id, primaryAssetId]);
  }

  @override
  String toString() => 'AssetStackResponseDto(assetCount=$assetCount, id=$id, primaryAssetId=$primaryAssetId)';
}
