// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SharedLinkCreateDto {
  const SharedLinkCreateDto({
    this.albumId = const Optional.absent(),
    this.allowDownload = const Optional.absent(),
    this.allowUpload = const Optional.absent(),
    this.assetIds = const Optional.absent(),
    this.description = const Optional.absent(),
    this.expiresAt = const Optional.absent(),
    this.password = const Optional.absent(),
    this.showMetadata = const Optional.absent(),
    this.slug = const Optional.absent(),
    required this.type,
  });

  /// Album ID (for album sharing)
  final Optional<String> albumId;

  /// Allow downloads
  final Optional<bool> allowDownload;

  /// Allow uploads
  final Optional<bool> allowUpload;

  /// Asset IDs (for individual assets)
  final Optional<List<String>> assetIds;

  /// Link description
  final Optional<String?> description;

  /// Expiration date
  final Optional<DateTime?> expiresAt;

  /// Link password
  final Optional<String?> password;

  /// Show metadata
  final Optional<bool> showMetadata;

  /// Custom URL slug
  final Optional<String?> slug;

  final SharedLinkType type;

  static SharedLinkCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SharedLinkCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumId: json.containsKey(r'albumId') ? Optional.present(json[r'albumId'] as String) : const Optional.absent(),
      allowDownload: json.containsKey(r'allowDownload')
          ? Optional.present(json[r'allowDownload'] as bool)
          : const Optional.absent(),
      allowUpload: json.containsKey(r'allowUpload')
          ? Optional.present(json[r'allowUpload'] as bool)
          : const Optional.absent(),
      assetIds: json.containsKey(r'assetIds')
          ? Optional.present(((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present((json[r'description'] as String?))
          : const Optional.absent(),
      expiresAt: json.containsKey(r'expiresAt')
          ? Optional.present((json[r'expiresAt'] == null ? null : DateTime.parse(json[r'expiresAt'] as String)))
          : const Optional.absent(),
      password: json.containsKey(r'password')
          ? Optional.present((json[r'password'] as String?))
          : const Optional.absent(),
      showMetadata: json.containsKey(r'showMetadata')
          ? Optional.present(json[r'showMetadata'] as bool)
          : const Optional.absent(),
      slug: json.containsKey(r'slug') ? Optional.present((json[r'slug'] as String?)) : const Optional.absent(),
      type: (SharedLinkType.fromJson(json[r'type']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albumId case Present(:final value)) {
      json[r'albumId'] = value;
    }
    if (allowDownload case Present(:final value)) {
      json[r'allowDownload'] = value;
    }
    if (allowUpload case Present(:final value)) {
      json[r'allowUpload'] = value;
    }
    if (assetIds case Present(:final value)) {
      json[r'assetIds'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (expiresAt case Present(:final value)) {
      json[r'expiresAt'] = value?.toUtc().toIso8601String();
    }
    if (password case Present(:final value)) {
      json[r'password'] = value;
    }
    if (showMetadata case Present(:final value)) {
      json[r'showMetadata'] = value;
    }
    if (slug case Present(:final value)) {
      json[r'slug'] = value;
    }
    json[r'type'] = type.toJson();
    return json;
  }

  SharedLinkCreateDto copyWith({
    Optional<String>? albumId,
    Optional<bool>? allowDownload,
    Optional<bool>? allowUpload,
    Optional<List<String>>? assetIds,
    Optional<String?>? description,
    Optional<DateTime?>? expiresAt,
    Optional<String?>? password,
    Optional<bool>? showMetadata,
    Optional<String?>? slug,
    SharedLinkType? type,
  }) {
    return .new(
      albumId: albumId ?? this.albumId,
      allowDownload: allowDownload ?? this.allowDownload,
      allowUpload: allowUpload ?? this.allowUpload,
      assetIds: assetIds ?? this.assetIds,
      description: description ?? this.description,
      expiresAt: expiresAt ?? this.expiresAt,
      password: password ?? this.password,
      showMetadata: showMetadata ?? this.showMetadata,
      slug: slug ?? this.slug,
      type: type ?? this.type,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SharedLinkCreateDto &&
            albumId == other.albumId &&
            allowDownload == other.allowDownload &&
            allowUpload == other.allowUpload &&
            assetIds == other.assetIds &&
            description == other.description &&
            expiresAt == other.expiresAt &&
            password == other.password &&
            showMetadata == other.showMetadata &&
            slug == other.slug &&
            type == other.type);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      albumId,
      allowDownload,
      allowUpload,
      assetIds,
      description,
      expiresAt,
      password,
      showMetadata,
      slug,
      type,
    ]);
  }

  @override
  String toString() =>
      'SharedLinkCreateDto(albumId=$albumId, allowDownload=$allowDownload, allowUpload=$allowUpload, assetIds=$assetIds, description=$description, expiresAt=$expiresAt, password=$password, showMetadata=$showMetadata, slug=$slug, type=$type)';
}
