//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceAuthDto {
  /// Returns a new [MaintenanceAuthDto] instance.
  MaintenanceAuthDto({
    required this.username,
  });

  String username;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceAuthDto &&
    other.username == username;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (username.hashCode);

  @override
  String toString() => 'MaintenanceAuthDto[username=$username]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'username'] = this.username;
    return json;
  }

  /// Returns a new [MaintenanceAuthDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceAuthDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceAuthDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceAuthDto(
        username: mapValueOfType<String>(json, r'username')!,
      );
    }
    return null;
  }

  static List<MaintenanceAuthDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceAuthDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceAuthDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceAuthDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceAuthDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceAuthDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceAuthDto-objects as value to a dart map
  static Map<String, List<MaintenanceAuthDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceAuthDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceAuthDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'username',
  };
}

