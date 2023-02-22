//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerVersionReponseDto {
  /// Returns a new [ServerVersionReponseDto] instance.
  ServerVersionReponseDto({
    required this.major,
    required this.minor,
    required this.patch_,
  });

  int major;

  int minor;

  int patch_;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerVersionReponseDto &&
     other.major == major &&
     other.minor == minor &&
     other.patch_ == patch_;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (major.hashCode) +
    (minor.hashCode) +
    (patch_.hashCode);

  @override
  String toString() => 'ServerVersionReponseDto[major=$major, minor=$minor, patch_=$patch_]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'major'] = this.major;
      json[r'minor'] = this.minor;
      json[r'patch'] = this.patch_;
    return json;
  }

  /// Returns a new [ServerVersionReponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerVersionReponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "ServerVersionReponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "ServerVersionReponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return ServerVersionReponseDto(
        major: mapValueOfType<int>(json, r'major')!,
        minor: mapValueOfType<int>(json, r'minor')!,
        patch_: mapValueOfType<int>(json, r'patch')!,
      );
    }
    return null;
  }

  static List<ServerVersionReponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerVersionReponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerVersionReponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerVersionReponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerVersionReponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerVersionReponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerVersionReponseDto-objects as value to a dart map
  static Map<String, List<ServerVersionReponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerVersionReponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerVersionReponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'major',
    'minor',
    'patch',
  };
}

