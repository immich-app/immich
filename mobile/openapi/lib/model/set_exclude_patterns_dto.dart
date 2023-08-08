//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SetExcludePatternsDto {
  /// Returns a new [SetExcludePatternsDto] instance.
  SetExcludePatternsDto({
    this.excludePatterns = const [],
  });

  List<String> excludePatterns;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SetExcludePatternsDto &&
     other.excludePatterns == excludePatterns;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (excludePatterns.hashCode);

  @override
  String toString() => 'SetExcludePatternsDto[excludePatterns=$excludePatterns]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'excludePatterns'] = this.excludePatterns;
    return json;
  }

  /// Returns a new [SetExcludePatternsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SetExcludePatternsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SetExcludePatternsDto(
        excludePatterns: json[r'excludePatterns'] is List
            ? (json[r'excludePatterns'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<SetExcludePatternsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SetExcludePatternsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SetExcludePatternsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SetExcludePatternsDto> mapFromJson(dynamic json) {
    final map = <String, SetExcludePatternsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SetExcludePatternsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SetExcludePatternsDto-objects as value to a dart map
  static Map<String, List<SetExcludePatternsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SetExcludePatternsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SetExcludePatternsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'excludePatterns',
  };
}

