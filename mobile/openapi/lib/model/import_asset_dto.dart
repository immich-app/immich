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
    required this.assetPath,
    required this.deviceAssetId,
    required this.deviceId,
    this.duration,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    this.isArchived,
    required this.isFavorite,
    this.isReadOnly = true,
    this.isVisible,
    this.sidecarPath,
  });

  String assetPath;

  String deviceAssetId;

  String deviceId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? duration;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isArchived;

  bool isFavorite;

  bool isReadOnly;

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
  String? sidecarPath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImportAssetDto &&
     other.assetPath == assetPath &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId &&
     other.duration == duration &&
     other.fileCreatedAt == fileCreatedAt &&
     other.fileModifiedAt == fileModifiedAt &&
     other.isArchived == isArchived &&
     other.isFavorite == isFavorite &&
     other.isReadOnly == isReadOnly &&
     other.isVisible == isVisible &&
     other.sidecarPath == sidecarPath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetPath.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duration == null ? 0 : duration!.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isFavorite.hashCode) +
    (isReadOnly.hashCode) +
    (isVisible == null ? 0 : isVisible!.hashCode) +
    (sidecarPath == null ? 0 : sidecarPath!.hashCode);

  @override
  String toString() => 'ImportAssetDto[assetPath=$assetPath, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duration=$duration, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, isArchived=$isArchived, isFavorite=$isFavorite, isReadOnly=$isReadOnly, isVisible=$isVisible, sidecarPath=$sidecarPath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetPath'] = this.assetPath;
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
    //  json[r'duration'] = null;
    }
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
    //  json[r'isArchived'] = null;
    }
      json[r'isFavorite'] = this.isFavorite;
      json[r'isReadOnly'] = this.isReadOnly;
    if (this.isVisible != null) {
      json[r'isVisible'] = this.isVisible;
    } else {
    //  json[r'isVisible'] = null;
    }
    if (this.sidecarPath != null) {
      json[r'sidecarPath'] = this.sidecarPath;
    } else {
    //  json[r'sidecarPath'] = null;
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
        assetPath: mapValueOfType<String>(json, r'assetPath')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duration: mapValueOfType<String>(json, r'duration'),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', '')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', '')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isReadOnly: mapValueOfType<bool>(json, r'isReadOnly') ?? true,
        isVisible: mapValueOfType<bool>(json, r'isVisible'),
        sidecarPath: mapValueOfType<String>(json, r'sidecarPath'),
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

