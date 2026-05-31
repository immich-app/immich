// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SharedLinkEditDto {
  const SharedLinkEditDto({
    this.allowDownload = const Optional.absent(),
    this.allowUpload = const Optional.absent(),
    this.changeExpiryTime = const Optional.absent(),
    this.description = const Optional.absent(),
    this.expiresAt = const Optional.absent(),
    this.password = const Optional.absent(),
    this.showMetadata = const Optional.absent(),
    this.slug = const Optional.absent(),
  });

  /// Allow downloads
  final Optional<bool> allowDownload;

  /// Allow uploads
  final Optional<bool> allowUpload;

  /// Whether to change the expiry time. Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.
  final Optional<bool> changeExpiryTime;

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

  static SharedLinkEditDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SharedLinkEditDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      allowDownload: json.containsKey(r'allowDownload')
          ? Optional.present(json[r'allowDownload'] as bool)
          : const Optional.absent(),
      allowUpload: json.containsKey(r'allowUpload')
          ? Optional.present(json[r'allowUpload'] as bool)
          : const Optional.absent(),
      changeExpiryTime: json.containsKey(r'changeExpiryTime')
          ? Optional.present(json[r'changeExpiryTime'] as bool)
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
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (allowDownload case Present(:final value)) {
      json[r'allowDownload'] = value;
    }
    if (allowUpload case Present(:final value)) {
      json[r'allowUpload'] = value;
    }
    if (changeExpiryTime case Present(:final value)) {
      json[r'changeExpiryTime'] = value;
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
    return json;
  }

  SharedLinkEditDto copyWith({
    Optional<bool>? allowDownload,
    Optional<bool>? allowUpload,
    Optional<bool>? changeExpiryTime,
    Optional<String?>? description,
    Optional<DateTime?>? expiresAt,
    Optional<String?>? password,
    Optional<bool>? showMetadata,
    Optional<String?>? slug,
  }) {
    return .new(
      allowDownload: allowDownload ?? this.allowDownload,
      allowUpload: allowUpload ?? this.allowUpload,
      changeExpiryTime: changeExpiryTime ?? this.changeExpiryTime,
      description: description ?? this.description,
      expiresAt: expiresAt ?? this.expiresAt,
      password: password ?? this.password,
      showMetadata: showMetadata ?? this.showMetadata,
      slug: slug ?? this.slug,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SharedLinkEditDto &&
            allowDownload == other.allowDownload &&
            allowUpload == other.allowUpload &&
            changeExpiryTime == other.changeExpiryTime &&
            description == other.description &&
            expiresAt == other.expiresAt &&
            password == other.password &&
            showMetadata == other.showMetadata &&
            slug == other.slug);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      allowDownload,
      allowUpload,
      changeExpiryTime,
      description,
      expiresAt,
      password,
      showMetadata,
      slug,
    ]);
  }

  @override
  String toString() =>
      'SharedLinkEditDto(allowDownload=$allowDownload, allowUpload=$allowUpload, changeExpiryTime=$changeExpiryTime, description=$description, expiresAt=$expiresAt, password=$password, showMetadata=$showMetadata, slug=$slug)';
}
