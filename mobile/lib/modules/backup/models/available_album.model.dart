import 'dart:typed_data';

import 'package:photo_manager/photo_manager.dart';

class AvailableAlbum {
  final AssetPathEntity albumEntity;
  final DateTime? lastBackup;
  AvailableAlbum({
    required this.albumEntity,
    this.lastBackup,
  });

  AvailableAlbum copyWith({
    AssetPathEntity? albumEntity,
    DateTime? lastBackup,
    Uint8List? thumbnailData,
  }) {
    return AvailableAlbum(
      albumEntity: albumEntity ?? this.albumEntity,
      lastBackup: lastBackup ?? this.lastBackup,
    );
  }

  String get name => albumEntity.name;

  Future<int> get assetCount => albumEntity.assetCountAsync;

  String get id => albumEntity.id;

  bool get isAll => albumEntity.isAll;

  @override
  String toString() =>
      'AvailableAlbum(albumEntity: $albumEntity, lastBackup: $lastBackup)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AvailableAlbum && other.albumEntity == albumEntity;
  }

  @override
  int get hashCode => albumEntity.hashCode;
}
