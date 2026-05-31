// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Shared link response
final class SharedLinkResponseDto {
  const SharedLinkResponseDto({
    this.album,
    required this.allowDownload,
    required this.allowUpload,
    required this.assets,
    required this.createdAt,
    required this.description,
    required this.expiresAt,
    required this.id,
    required this.key,
    required this.password,
    required this.showMetadata,
    required this.slug,
    required this.type,
    required this.userId,
  });

  final AlbumResponseDto? album;

  /// Allow downloads
  final bool allowDownload;

  /// Allow uploads
  final bool allowUpload;

  final List<AssetResponseDto> assets;

  /// Creation date
  final DateTime createdAt;

  /// Link description
  final String? description;

  /// Expiration date
  final DateTime? expiresAt;

  /// Shared link ID
  final String id;

  /// Encryption key (base64url)
  final String key;

  /// Has password
  final String? password;

  /// Show metadata
  final bool showMetadata;

  /// Custom URL slug
  final String? slug;

  final SharedLinkType type;

  /// Owner user ID
  final String userId;

  static const _undefined = Object();

  static SharedLinkResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SharedLinkResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      album: AlbumResponseDto.fromJson(json[r'album']),
      allowDownload: json[r'allowDownload'] as bool,
      allowUpload: json[r'allowUpload'] as bool,
      assets: ((json[r'assets'] as List?)?.map(($e) => (AssetResponseDto.fromJson($e))!).toList(growable: false))!,
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      description: (json[r'description'] as String?),
      expiresAt: (json[r'expiresAt'] == null ? null : DateTime.parse(json[r'expiresAt'] as String)),
      id: json[r'id'] as String,
      key: json[r'key'] as String,
      password: (json[r'password'] as String?),
      showMetadata: json[r'showMetadata'] as bool,
      slug: (json[r'slug'] as String?),
      type: (SharedLinkType.fromJson(json[r'type']))!,
      userId: json[r'userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (album != null) {
      json[r'album'] = album!.toJson();
    }
    json[r'allowDownload'] = allowDownload;
    json[r'allowUpload'] = allowUpload;
    json[r'assets'] = assets.map(($e) => $e.toJson()).toList(growable: false);
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    if (description != null) {
      json[r'description'] = description!;
    }
    if (expiresAt != null) {
      json[r'expiresAt'] = expiresAt!.toUtc().toIso8601String();
    }
    json[r'id'] = id;
    json[r'key'] = key;
    if (password != null) {
      json[r'password'] = password!;
    }
    json[r'showMetadata'] = showMetadata;
    if (slug != null) {
      json[r'slug'] = slug!;
    }
    json[r'type'] = type.toJson();
    json[r'userId'] = userId;
    return json;
  }

  SharedLinkResponseDto copyWith({
    Object? album = _undefined,
    bool? allowDownload,
    bool? allowUpload,
    List<AssetResponseDto>? assets,
    DateTime? createdAt,
    Object? description = _undefined,
    Object? expiresAt = _undefined,
    String? id,
    String? key,
    Object? password = _undefined,
    bool? showMetadata,
    Object? slug = _undefined,
    SharedLinkType? type,
    String? userId,
  }) {
    return .new(
      album: identical(album, _undefined) ? this.album : album as AlbumResponseDto?,
      allowDownload: allowDownload ?? this.allowDownload,
      allowUpload: allowUpload ?? this.allowUpload,
      assets: assets ?? this.assets,
      createdAt: createdAt ?? this.createdAt,
      description: identical(description, _undefined) ? this.description : description as String?,
      expiresAt: identical(expiresAt, _undefined) ? this.expiresAt : expiresAt as DateTime?,
      id: id ?? this.id,
      key: key ?? this.key,
      password: identical(password, _undefined) ? this.password : password as String?,
      showMetadata: showMetadata ?? this.showMetadata,
      slug: identical(slug, _undefined) ? this.slug : slug as String?,
      type: type ?? this.type,
      userId: userId ?? this.userId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SharedLinkResponseDto &&
            album == other.album &&
            allowDownload == other.allowDownload &&
            allowUpload == other.allowUpload &&
            const DeepCollectionEquality().equals(assets, other.assets) &&
            createdAt == other.createdAt &&
            description == other.description &&
            expiresAt == other.expiresAt &&
            id == other.id &&
            key == other.key &&
            password == other.password &&
            showMetadata == other.showMetadata &&
            slug == other.slug &&
            type == other.type &&
            userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      album,
      allowDownload,
      allowUpload,
      const DeepCollectionEquality().hash(assets),
      createdAt,
      description,
      expiresAt,
      id,
      key,
      password,
      showMetadata,
      slug,
      type,
      userId,
    ]);
  }

  @override
  String toString() =>
      'SharedLinkResponseDto(album=$album, allowDownload=$allowDownload, allowUpload=$allowUpload, assets=$assets, createdAt=$createdAt, description=$description, expiresAt=$expiresAt, id=$id, key=$key, password=$password, showMetadata=$showMetadata, slug=$slug, type=$type, userId=$userId)';
}
