import 'dart:typed_data';

import 'package:immich_mobile/entities/album.entity.dart';

class AvailableAlbum {
  final Album album;
  final int assetCount;
  final DateTime? lastBackup;
  AvailableAlbum({
    required this.album,
    required this.assetCount,
    this.lastBackup,
  });

  AvailableAlbum copyWith({
    Album? album,
    int? assetCount,
    DateTime? lastBackup,
    Uint8List? thumbnailData,
  }) {
    return AvailableAlbum(
      album: album ?? this.album,
      assetCount: assetCount ?? this.assetCount,
      lastBackup: lastBackup ?? this.lastBackup,
    );
  }

  String get name => album.name;

  String get id => album.localId!;

  bool get isAll => album.isAll;

  @override
  String toString() =>
      'AvailableAlbum(albumEntity: $album, lastBackup: $lastBackup)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AvailableAlbum && other.album == album;
  }

  @override
  int get hashCode => album.hashCode;
}
