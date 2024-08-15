//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigTagsDto {
  /// Returns a new [SystemConfigTagsDto] instance.
  SystemConfigTagsDto({
    required this.import_,
  });

  bool import_;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigTagsDto &&
    other.import_ == import_;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (import_.hashCode);

  @override
  String toString() => 'SystemConfigTagsDto[import_=$import_]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'import'] = this.import_;
    return json;
  }

  /// Returns a new [SystemConfigTagsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigTagsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigTagsDto(
        import_: mapValueOfType<bool>(json, r'import')!,
      );
    }
    return null;
  }

  static List<SystemConfigTagsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigTagsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigTagsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigTagsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigTagsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigTagsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigTagsDto-objects as value to a dart map
  static Map<String, List<SystemConfigTagsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigTagsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigTagsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'import',
  };
}

