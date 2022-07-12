import 'package:collection/collection.dart';
import 'package:openapi/api.dart';

class SharedAlbum {
  final String id;
  final String ownerId;
  final String albumName;
  final String createdAt;
  final String? albumThumbnailAssetId;
  final List<AssetResponseDto> sharedUsers;
  final List<AssetResponseDto>? assets;

  SharedAlbum({
    required this.id,
    required this.ownerId,
    required this.albumName,
    required this.createdAt,
    required this.albumThumbnailAssetId,
    required this.sharedUsers,
    this.assets,
  });

  SharedAlbum copyWith({
    String? id,
    String? ownerId,
    String? albumName,
    String? createdAt,
    String? albumThumbnailAssetId,
    List<AssetResponseDto>? sharedUsers,
    List<AssetResponseDto>? assets,
  }) {
    return SharedAlbum(
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      albumName: albumName ?? this.albumName,
      createdAt: createdAt ?? this.createdAt,
      albumThumbnailAssetId:
          albumThumbnailAssetId ?? this.albumThumbnailAssetId,
      sharedUsers: sharedUsers ?? this.sharedUsers,
      assets: assets ?? this.assets,
    );
  }

  @override
  String toString() {
    return 'SharedAlbum(id: $id, ownerId: $ownerId, albumName: $albumName, createdAt: $createdAt, albumThumbnailAssetId: $albumThumbnailAssetId, sharedUsers: $sharedUsers, assets: $assets)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other is SharedAlbum &&
        other.id == id &&
        other.ownerId == ownerId &&
        other.albumName == albumName &&
        other.createdAt == createdAt &&
        other.albumThumbnailAssetId == albumThumbnailAssetId &&
        listEquals(other.sharedUsers, sharedUsers) &&
        listEquals(other.assets, assets);
  }

  @override
  int get hashCode {
    return id.hashCode ^
        ownerId.hashCode ^
        albumName.hashCode ^
        createdAt.hashCode ^
        albumThumbnailAssetId.hashCode ^
        sharedUsers.hashCode ^
        assets.hashCode;
  }
}
