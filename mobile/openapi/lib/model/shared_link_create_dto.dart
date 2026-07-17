//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkCreateDto {
  /// Returns a new [SharedLinkCreateDto] instance.
  SharedLinkCreateDto({
    this.albumId = const Optional.absent(),
    this.allowDownload = const Optional.present(true),
    this.allowUpload = const Optional.absent(),
    this.assetIds = const Optional.present(const []),
    this.description = const Optional.absent(),
    this.expiresAt = const Optional.absent(),
    this.password = const Optional.absent(),
    this.showMetadata = const Optional.present(true),
    this.slug = const Optional.absent(),
    required this.type,
  });

  /// Album ID (for album sharing)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> albumId;

  /// Allow downloads
  Optional<bool?> allowDownload;

  /// Allow uploads
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> allowUpload;

  /// Asset IDs (for individual assets)
  Optional<List<String>?> assetIds;

  /// Link description
  Optional<String?> description;

  /// Expiration date
  Optional<DateTime?> expiresAt;

  /// Link password
  Optional<String?> password;

  /// Show metadata
  Optional<bool?> showMetadata;

  /// Custom URL slug
  Optional<String?> slug;

  SharedLinkType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkCreateDto &&
    other.albumId == albumId &&
    other.allowDownload == allowDownload &&
    other.allowUpload == allowUpload &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.description == description &&
    other.expiresAt == expiresAt &&
    other.password == password &&
    other.showMetadata == showMetadata &&
    other.slug == slug &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId == null ? 0 : albumId!.hashCode) +
    (allowDownload.hashCode) +
    (allowUpload == null ? 0 : allowUpload!.hashCode) +
    (assetIds.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (showMetadata.hashCode) +
    (slug == null ? 0 : slug!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'SharedLinkCreateDto[albumId=$albumId, allowDownload=$allowDownload, allowUpload=$allowUpload, assetIds=$assetIds, description=$description, expiresAt=$expiresAt, password=$password, showMetadata=$showMetadata, slug=$slug, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumId.isPresent) {
      final value = this.albumId.value;
      json[r'albumId'] = value;
    }
    if (this.allowDownload.isPresent) {
      final value = this.allowDownload.value;
      json[r'allowDownload'] = value;
    }
    if (this.allowUpload.isPresent) {
      final value = this.allowUpload.value;
      json[r'allowUpload'] = value;
    }
    if (this.assetIds.isPresent) {
      final value = this.assetIds.value;
      json[r'assetIds'] = value;
    }
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.expiresAt.isPresent) {
      final value = this.expiresAt.value;
      json[r'expiresAt'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.password.isPresent) {
      final value = this.password.value;
      json[r'password'] = value;
    }
    if (this.showMetadata.isPresent) {
      final value = this.showMetadata.value;
      json[r'showMetadata'] = value;
    }
    if (this.slug.isPresent) {
      final value = this.slug.value;
      json[r'slug'] = value;
    }
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [SharedLinkCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedLinkCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkCreateDto(
        albumId: json.containsKey(r'albumId') ? Optional.present(mapValueOfType<String>(json, r'albumId')) : const Optional.absent(),
        allowDownload: json.containsKey(r'allowDownload') ? Optional.present(mapValueOfType<bool>(json, r'allowDownload')) : const Optional.absent(),
        allowUpload: json.containsKey(r'allowUpload') ? Optional.present(mapValueOfType<bool>(json, r'allowUpload')) : const Optional.absent(),
        assetIds: json.containsKey(r'assetIds') ? Optional.present(json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        description: json.containsKey(r'description') ? Optional.present(mapValueOfType<String>(json, r'description')) : const Optional.absent(),
        expiresAt: json.containsKey(r'expiresAt') ? Optional.present(mapDateTime(json, r'expiresAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        password: json.containsKey(r'password') ? Optional.present(mapValueOfType<String>(json, r'password')) : const Optional.absent(),
        showMetadata: json.containsKey(r'showMetadata') ? Optional.present(mapValueOfType<bool>(json, r'showMetadata')) : const Optional.absent(),
        slug: json.containsKey(r'slug') ? Optional.present(mapValueOfType<String>(json, r'slug')) : const Optional.absent(),
        type: SharedLinkType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<SharedLinkCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinkCreateDto> mapFromJson(dynamic json) {
    final map = <String, SharedLinkCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinkCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinkCreateDto-objects as value to a dart map
  static Map<String, List<SharedLinkCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinkCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinkCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'type',
  };
}

