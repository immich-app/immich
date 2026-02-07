//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkLoginDto {
  /// Returns a new [SharedLinkLoginDto] instance.
  SharedLinkLoginDto({
    required this.password,
  });

  /// Shared link password
  String password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkLoginDto &&
    other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (password.hashCode);

  @override
  String toString() => 'SharedLinkLoginDto[password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'password'] = this.password;
    return json;
  }

  /// Returns a new [SharedLinkLoginDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkLoginDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedLinkLoginDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkLoginDto(
        password: mapValueOfType<String>(json, r'password')!,
      );
    }
    return null;
  }

  static List<SharedLinkLoginDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkLoginDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkLoginDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinkLoginDto> mapFromJson(dynamic json) {
    final map = <String, SharedLinkLoginDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinkLoginDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinkLoginDto-objects as value to a dart map
  static Map<String, List<SharedLinkLoginDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinkLoginDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinkLoginDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'password',
  };
}

