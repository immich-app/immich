//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFileUploadResponseDto {
  /// Returns a new [AssetFileUploadResponseDto] instance.
  AssetFileUploadResponseDto({
    required this.duplicate,
    required this.id,
  });

  bool duplicate;

  String id;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFileUploadResponseDto &&
    other.duplicate == duplicate &&
    other.id == id;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicate.hashCode) +
    (id.hashCode);

  @override
  String toString() => 'AssetFileUploadResponseDto[duplicate=$duplicate, id=$id]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicate'] = this.duplicate;
      json[r'id'] = this.id;
    return json;
  }

  /// Returns a new [AssetFileUploadResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFileUploadResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFileUploadResponseDto(
        duplicate: mapValueOfType<bool>(json, r'duplicate')!,
        id: mapValueOfType<String>(json, r'id')!,
      );
    }
    return null;
  }

  static List<AssetFileUploadResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFileUploadResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFileUploadResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFileUploadResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetFileUploadResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFileUploadResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFileUploadResponseDto-objects as value to a dart map
  static Map<String, List<AssetFileUploadResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFileUploadResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFileUploadResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicate',
    'id',
  };
}

