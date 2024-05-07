import 'package:openapi/api.dart';

enum SharedLinkSource { album, individual }

class SharedLink {
  final String id;
  final String title;
  final bool allowDownload;
  final bool allowUpload;
  final String? thumbAssetId;
  final String? description;
  final String? password;
  final DateTime? expiresAt;
  final String key;
  final bool showMetadata;
  final SharedLinkSource type;

  const SharedLink({
    required this.id,
    required this.title,
    required this.allowDownload,
    required this.allowUpload,
    required this.thumbAssetId,
    required this.description,
    required this.password,
    required this.expiresAt,
    required this.key,
    required this.showMetadata,
    required this.type,
  });

  SharedLink copyWith({
    String? id,
    String? title,
    String? thumbAssetId,
    bool? allowDownload,
    bool? allowUpload,
    String? description,
    String? password,
    DateTime? expiresAt,
    String? key,
    bool? showMetadata,
    SharedLinkSource? type,
  }) {
    return SharedLink(
      id: id ?? this.id,
      title: title ?? this.title,
      thumbAssetId: thumbAssetId ?? this.thumbAssetId,
      allowDownload: allowDownload ?? this.allowDownload,
      allowUpload: allowUpload ?? this.allowUpload,
      description: description ?? this.description,
      password: password ?? this.password,
      expiresAt: expiresAt ?? this.expiresAt,
      key: key ?? this.key,
      showMetadata: showMetadata ?? this.showMetadata,
      type: type ?? this.type,
    );
  }

  SharedLink.fromDto(SharedLinkResponseDto dto)
      : id = dto.id,
        allowDownload = dto.allowDownload,
        allowUpload = dto.allowUpload,
        description = dto.description,
        password = dto.password,
        expiresAt = dto.expiresAt,
        key = dto.key,
        showMetadata = dto.showMetadata,
        type = dto.type == SharedLinkType.ALBUM
            ? SharedLinkSource.album
            : SharedLinkSource.individual,
        title = dto.type == SharedLinkType.ALBUM
            ? dto.album?.albumName.toUpperCase() ?? "UNKNOWN SHARE"
            : "INDIVIDUAL SHARE",
        thumbAssetId = dto.type == SharedLinkType.ALBUM
            ? dto.album?.albumThumbnailAssetId
            : dto.assets.isNotEmpty
                ? dto.assets[0].id
                : null;

  @override
  String toString() =>
      'SharedLink(id=$id, title=$title, thumbAssetId=$thumbAssetId, allowDownload=$allowDownload, allowUpload=$allowUpload, description=$description, password=$password, expiresAt=$expiresAt, key=$key, showMetadata=$showMetadata, type=$type)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SharedLink &&
          other.id == id &&
          other.title == title &&
          other.thumbAssetId == thumbAssetId &&
          other.allowDownload == allowDownload &&
          other.allowUpload == allowUpload &&
          other.description == description &&
          other.password == password &&
          other.expiresAt == expiresAt &&
          other.key == key &&
          other.showMetadata == showMetadata &&
          other.type == type;

  @override
  int get hashCode =>
      id.hashCode ^
      title.hashCode ^
      thumbAssetId.hashCode ^
      allowDownload.hashCode ^
      allowUpload.hashCode ^
      description.hashCode ^
      password.hashCode ^
      expiresAt.hashCode ^
      key.hashCode ^
      showMetadata.hashCode ^
      type.hashCode;
}
