//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class APIKeyCreateDto {
  /// Returns a new [APIKeyCreateDto] instance.
  APIKeyCreateDto({
    this.name,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is APIKeyCreateDto &&
     other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'APIKeyCreateDto[name=$name]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (name != null) {
      _json[r'name'] = name;
    } else {
      _json[r'name'] = null;
    }
    return _json;
  }

  /// Returns a new [APIKeyCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static APIKeyCreateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "APIKeyCreateDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "APIKeyCreateDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return APIKeyCreateDto(
        name: mapValueOfType<String>(json, r'name'),
      );
    }
    return null;
  }

  static List<APIKeyCreateDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <APIKeyCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = APIKeyCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, APIKeyCreateDto> mapFromJson(dynamic json) {
    final map = <String, APIKeyCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of APIKeyCreateDto-objects as value to a dart map
  static Map<String, List<APIKeyCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<APIKeyCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyCreateDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

