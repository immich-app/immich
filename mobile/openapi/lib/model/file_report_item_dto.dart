//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FileReportItemDto {
  /// Returns a new [FileReportItemDto] instance.
  FileReportItemDto({
    this.checksum,
    required this.entityId,
    required this.entityType,
    required this.pathType,
    required this.pathValue,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? checksum;

  String entityId;

  PathEntityType entityType;

  PathType pathType;

  String pathValue;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FileReportItemDto &&
    other.checksum == checksum &&
    other.entityId == entityId &&
    other.entityType == entityType &&
    other.pathType == pathType &&
    other.pathValue == pathValue;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum == null ? 0 : checksum!.hashCode) +
    (entityId.hashCode) +
    (entityType.hashCode) +
    (pathType.hashCode) +
    (pathValue.hashCode);

  @override
  String toString() => 'FileReportItemDto[checksum=$checksum, entityId=$entityId, entityType=$entityType, pathType=$pathType, pathValue=$pathValue]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.checksum != null) {
      json[r'checksum'] = this.checksum;
    } else {
    //  json[r'checksum'] = null;
    }
      json[r'entityId'] = this.entityId;
      json[r'entityType'] = this.entityType;
      json[r'pathType'] = this.pathType;
      json[r'pathValue'] = this.pathValue;
    return json;
  }

  /// Returns a new [FileReportItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FileReportItemDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FileReportItemDto(
        checksum: mapValueOfType<String>(json, r'checksum'),
        entityId: mapValueOfType<String>(json, r'entityId')!,
        entityType: PathEntityType.fromJson(json[r'entityType'])!,
        pathType: PathType.fromJson(json[r'pathType'])!,
        pathValue: mapValueOfType<String>(json, r'pathValue')!,
      );
    }
    return null;
  }

  static List<FileReportItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FileReportItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FileReportItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FileReportItemDto> mapFromJson(dynamic json) {
    final map = <String, FileReportItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FileReportItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FileReportItemDto-objects as value to a dart map
  static Map<String, List<FileReportItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FileReportItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FileReportItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'entityId',
    'entityType',
    'pathType',
    'pathValue',
  };
}

