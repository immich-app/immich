// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:openapi/api.dart';

part 'shared_link.model.freezed.dart';

enum SharedLinkSource { album, individual }

@freezed
class const SharedLink({
  required final String id,
  required final String title,
  required final bool allowDownload,
  required final bool allowUpload,
  required final String? thumbAssetId,
  required final String? description,
  required final String? password,
  required final DateTime? expiresAt,
  required final String key,
  required final bool showMetadata,
  required final SharedLinkSource type,
  required final String? slug,
}) with _$SharedLink {
  factory SharedLink.fromDto(SharedLinkResponseDto dto) {
    final isAlbum = dto.type == SharedLinkType.ALBUM;
    return SharedLink(
      id: dto.id,
      allowDownload: dto.allowDownload,
      allowUpload: dto.allowUpload,
      description: dto.description,
      password: dto.password,
      expiresAt: dto.expiresAt,
      key: dto.key,
      showMetadata: dto.showMetadata,
      slug: dto.slug,
      type: isAlbum ? SharedLinkSource.album : SharedLinkSource.individual,
      title: isAlbum ? dto.album.orElse(null)?.albumName.toUpperCase() ?? "UNKNOWN SHARE" : "INDIVIDUAL SHARE",
      thumbAssetId: isAlbum
          ? dto.album.orElse(null)?.albumThumbnailAssetId
          : dto.assets.isNotEmpty
          ? dto.assets[0].id
          : null,
    );
  }
}
