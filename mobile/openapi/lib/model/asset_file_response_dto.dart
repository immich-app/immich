//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFileResponseDto {
  /// Returns a new [AssetFileResponseDto] instance.
  AssetFileResponseDto({
    required this.createdAt,
    required this.id,
    required this.isEdited,
    required this.isProgressive,
    required this.path,
    required this.type,
    required this.updatedAt,
  });

  /// Creation date
  DateTime createdAt;

  /// Asset file ID
  String id;

  /// The file was generated from an edit
  bool isEdited;

  /// The file is a progressively encoded JPEG
  bool isProgressive;

  /// File path
  String path;

  /// Type of file
  AssetFileType type;

  /// Update date
  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFileResponseDto &&
    other.createdAt == createdAt &&
    other.id == id &&
    other.isEdited == isEdited &&
    other.isProgressive == isProgressive &&
    other.path == path &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (id.hashCode) +
    (isEdited.hashCode) +
    (isProgressive.hashCode) +
    (path.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AssetFileResponseDto[createdAt=$createdAt, id=$id, isEdited=$isEdited, isProgressive=$isProgressive, path=$path, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'isEdited'] = this.isEdited;
      json[r'isProgressive'] = this.isProgressive;
      json[r'path'] = this.path;
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AssetFileResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFileResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFileResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFileResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        isEdited: mapValueOfType<bool>(json, r'isEdited')!,
        isProgressive: mapValueOfType<bool>(json, r'isProgressive')!,
        path: mapValueOfType<String>(json, r'path')!,
        type: AssetFileType.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<AssetFileResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFileResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFileResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFileResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetFileResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFileResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFileResponseDto-objects as value to a dart map
  static Map<String, List<AssetFileResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFileResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFileResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'isEdited',
    'isProgressive',
    'path',
    'type',
    'updatedAt',
  };
}

