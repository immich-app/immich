//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SetMaintenanceModeDto {
  /// Returns a new [SetMaintenanceModeDto] instance.
  SetMaintenanceModeDto({
    required this.action,
  });

  MaintenanceAction action;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SetMaintenanceModeDto &&
    other.action == action;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode);

  @override
  String toString() => 'SetMaintenanceModeDto[action=$action]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
    return json;
  }

  /// Returns a new [SetMaintenanceModeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SetMaintenanceModeDto? fromJson(dynamic value) {
    upgradeDto(value, "SetMaintenanceModeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SetMaintenanceModeDto(
        action: MaintenanceAction.fromJson(json[r'action'])!,
      );
    }
    return null;
  }

  static List<SetMaintenanceModeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SetMaintenanceModeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SetMaintenanceModeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SetMaintenanceModeDto> mapFromJson(dynamic json) {
    final map = <String, SetMaintenanceModeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SetMaintenanceModeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SetMaintenanceModeDto-objects as value to a dart map
  static Map<String, List<SetMaintenanceModeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SetMaintenanceModeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SetMaintenanceModeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
  };
}

