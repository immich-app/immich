// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';

part 'album.model.freezed.dart';

enum AlbumAssetOrder {
  // do not change this order!
  asc,
  desc,
}

enum AlbumUserRole {
  // do not change this order!
  editor,
  viewer,
  owner,
}

// Model for an album stored in the server
@freezed
class const RemoteAlbum({
  required final String id,
  required final String name,
  required final String ownerId,
  required final String description,
  required final DateTime createdAt,
  required final DateTime updatedAt,
  final String? thumbnailAssetId,
  required final bool isActivityEnabled,
  required final AlbumAssetOrder order,
  required final int assetCount,
  required final String ownerName,
  required final bool isShared,
}) with _$RemoteAlbum;
