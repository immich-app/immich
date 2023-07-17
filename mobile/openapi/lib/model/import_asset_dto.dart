//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImportAssetDto {
  /// Returns a new [ImportAssetDto] instance.
  ImportAssetDto({
    this.isReadOnly = true,
    required this.assetPath,
    this.sidecarPath,
    required this.deviceAssetId,
    required this.deviceId,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.isFavorite,
    this.isArchived,
    this.isVisible,
    this.duration,
  });

  bool isReadOnly;

  String assetPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? sidecarPath;

  String deviceAssetId;

  String deviceId;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  bool isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isArchived;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isVisible;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? duration;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImportAssetDto &&
     other.isReadOnly == isReadOnly &&
     other.assetPath == assetPath &&
     other.sidecarPath == sidecarPath &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId &&
     other.fileCreatedAt == fileCreatedAt &&
     other.fileModifiedAt == fileModifiedAt &&
     other.isFavorite == isFavorite &&
     other.isArchived == isArchived &&
     other.isVisible == isVisible &&
     other.duration == duration;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isReadOnly.hashCode) +
    (assetPath.hashCode) +
    (sidecarPath == null ? 0 : sidecarPath!.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (isFavorite.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isVisible == null ? 0 : isVisible!.hashCode) +
    (duration == null ? 0 : duration!.hashCode);

  @override
  String toString() => 'ImportAssetDto[isReadOnly=$isReadOnly, assetPath=$assetPath, sidecarPath=$sidecarPath, deviceAssetId=$deviceAssetId, deviceId=$deviceId, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, isFavorite=$isFavorite, isArchived=$isArchived, isVisible=$isVisible, duration=$duration]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isReadOnly'] = this.isReadOnly;
      json[r'assetPath'] = this.assetPath;
    if (this.sidecarPath != null) {
      json[r'sidecarPath'] = this.sidecarPath;
    } else {
    //  json[r'sidecarPath'] = null;
    }
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'isFavorite'] = this.isFavorite;
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
    //  json[r'isArchived'] = null;
    }
    if (this.isVisible != null) {
      json[r'isVisible'] = this.isVisible;
    } else {
    //  json[r'isVisible'] = null;
    }
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
    //  json[r'duration'] = null;
    }
    return json;
  }

  /// Returns a new [ImportAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImportAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImportAssetDto(
        isReadOnly: mapValueOfType<bool>(json, r'isReadOnly') ?? true,
        assetPath: mapValueOfType<String>(json, r'assetPath')!,
        sidecarPath: mapValueOfType<String>(json, r'sidecarPath'),
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isVisible: mapValueOfType<bool>(json, r'isVisible'),
        duration: mapValueOfType<String>(json, r'duration'),
      );
    }
    return null;
  }

  static List<ImportAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImportAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImportAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImportAssetDto> mapFromJson(dynamic json) {
    final map = <String, ImportAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImportAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImportAssetDto-objects as value to a dart map
  static Map<String, List<ImportAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImportAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImportAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetPath',
    'deviceAssetId',
    'deviceId',
    'fileCreatedAt',
    'fileModifiedAt',
    'isFavorite',
  };
}

