//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkCreateDto {
  /// Returns a new [SharedLinkCreateDto] instance.
  SharedLinkCreateDto({
    required this.type,
    this.assetIds = const [],
    this.albumId,
    this.description,
    this.expiresAt,
    this.allowUpload = false,
    this.allowDownload = true,
    this.showExif = true,
  });

  SharedLinkType type;

  List<String> assetIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? albumId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  DateTime? expiresAt;

  bool allowUpload;

  bool allowDownload;

  bool showExif;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkCreateDto &&
     other.type == type &&
     other.assetIds == assetIds &&
     other.albumId == albumId &&
     other.description == description &&
     other.expiresAt == expiresAt &&
     other.allowUpload == allowUpload &&
     other.allowDownload == allowDownload &&
     other.showExif == showExif;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (type.hashCode) +
    (assetIds.hashCode) +
    (albumId == null ? 0 : albumId!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (allowUpload.hashCode) +
    (allowDownload.hashCode) +
    (showExif.hashCode);

  @override
  String toString() => 'SharedLinkCreateDto[type=$type, assetIds=$assetIds, albumId=$albumId, description=$description, expiresAt=$expiresAt, allowUpload=$allowUpload, allowDownload=$allowDownload, showExif=$showExif]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'type'] = this.type;
      json[r'assetIds'] = this.assetIds;
    if (this.albumId != null) {
      json[r'albumId'] = this.albumId;
    } else {
    //  json[r'albumId'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
    //  json[r'expiresAt'] = null;
    }
      json[r'allowUpload'] = this.allowUpload;
      json[r'allowDownload'] = this.allowDownload;
      json[r'showExif'] = this.showExif;
    return json;
  }

  /// Returns a new [SharedLinkCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkCreateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkCreateDto(
        type: SharedLinkType.fromJson(json[r'type'])!,
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        albumId: mapValueOfType<String>(json, r'albumId'),
        description: mapValueOfType<String>(json, r'description'),
        expiresAt: mapDateTime(json, r'expiresAt', ''),
        allowUpload: mapValueOfType<bool>(json, r'allowUpload') ?? false,
        allowDownload: mapValueOfType<bool>(json, r'allowDownload') ?? true,
        showExif: mapValueOfType<bool>(json, r'showExif') ?? true,
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

