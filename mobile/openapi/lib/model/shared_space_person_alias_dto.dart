//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpacePersonAliasDto {
  /// Returns a new [SharedSpacePersonAliasDto] instance.
  SharedSpacePersonAliasDto({
    required this.alias,
  });

  /// Alias name for this person
  String alias;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpacePersonAliasDto &&
    other.alias == alias;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (alias.hashCode);

  @override
  String toString() => 'SharedSpacePersonAliasDto[alias=$alias]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'alias'] = this.alias;
    return json;
  }

  /// Returns a new [SharedSpacePersonAliasDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpacePersonAliasDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpacePersonAliasDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpacePersonAliasDto(
        alias: mapValueOfType<String>(json, r'alias')!,
      );
    }
    return null;
  }

  static List<SharedSpacePersonAliasDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpacePersonAliasDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpacePersonAliasDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpacePersonAliasDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpacePersonAliasDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpacePersonAliasDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpacePersonAliasDto-objects as value to a dart map
  static Map<String, List<SharedSpacePersonAliasDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpacePersonAliasDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpacePersonAliasDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'alias',
  };
}

