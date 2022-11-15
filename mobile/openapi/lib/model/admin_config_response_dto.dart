//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AdminConfigResponseDto {
  /// Returns a new [AdminConfigResponseDto] instance.
  AdminConfigResponseDto({
    required this.config,
  });

  Object config;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AdminConfigResponseDto &&
     other.config == config;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (config.hashCode);

  @override
  String toString() => 'AdminConfigResponseDto[config=$config]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'config'] = config;
    return _json;
  }

  /// Returns a new [AdminConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AdminConfigResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AdminConfigResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AdminConfigResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AdminConfigResponseDto(
        config: mapValueOfType<Object>(json, r'config')!,
      );
    }
    return null;
  }

  static List<AdminConfigResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AdminConfigResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AdminConfigResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AdminConfigResponseDto> mapFromJson(dynamic json) {
    final map = <String, AdminConfigResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AdminConfigResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AdminConfigResponseDto-objects as value to a dart map
  static Map<String, List<AdminConfigResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AdminConfigResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AdminConfigResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'config',
  };
}

