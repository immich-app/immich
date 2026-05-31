// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAlbumToAssetDeleteV1 {
  const SyncAlbumToAssetDeleteV1({required this.albumId, required this.assetId});

  /// Album ID
  final String albumId;

  /// Asset ID
  final String assetId;

  static SyncAlbumToAssetDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAlbumToAssetDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(albumId: json[r'albumId'] as String, assetId: json[r'assetId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumId'] = albumId;
    json[r'assetId'] = assetId;
    return json;
  }

  SyncAlbumToAssetDeleteV1 copyWith({String? albumId, String? assetId}) {
    return .new(albumId: albumId ?? this.albumId, assetId: assetId ?? this.assetId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAlbumToAssetDeleteV1 && albumId == other.albumId && assetId == other.assetId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId, assetId]);
  }

  @override
  String toString() => 'SyncAlbumToAssetDeleteV1(albumId=$albumId, assetId=$assetId)';
}
