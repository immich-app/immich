import 'dart:typed_data';

import 'package:photo_manager/photo_manager.dart';

class AvailableAlbum {
  final AssetPathEntity albumEntity;
  final Uint8List? thumbnailData;
  AvailableAlbum({
    required this.albumEntity,
    this.thumbnailData,
  });

  AvailableAlbum copyWith({
    AssetPathEntity? albumEntity,
    Uint8List? thumbnailData,
  }) {
    return AvailableAlbum(
      albumEntity: albumEntity ?? this.albumEntity,
      thumbnailData: thumbnailData ?? this.thumbnailData,
    );
  }

  @override
  String toString() => 'AvailableAlbum(albumEntity: $albumEntity, thumbnailData: $thumbnailData)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AvailableAlbum && other.albumEntity == albumEntity && other.thumbnailData == thumbnailData;
  }

  @override
  int get hashCode => albumEntity.hashCode ^ thumbnailData.hashCode;
}
