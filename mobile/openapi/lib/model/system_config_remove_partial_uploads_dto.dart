//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigRemovePartialUploadsDto {
  /// Returns a new [SystemConfigRemovePartialUploadsDto] instance.
  SystemConfigRemovePartialUploadsDto({
    required this.enabled,
    required this.hoursAgo,
  });

  bool enabled;

  /// Minimum value: 1
  int hoursAgo;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigRemovePartialUploadsDto &&
    other.enabled == enabled &&
    other.hoursAgo == hoursAgo;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (hoursAgo.hashCode);

  @override
  String toString() => 'SystemConfigRemovePartialUploadsDto[enabled=$enabled, hoursAgo=$hoursAgo]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'hoursAgo'] = this.hoursAgo;
    return json;
  }

  /// Returns a new [SystemConfigRemovePartialUploadsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigRemovePartialUploadsDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigRemovePartialUploadsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigRemovePartialUploadsDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        hoursAgo: mapValueOfType<int>(json, r'hoursAgo')!,
      );
    }
    return null;
  }

  static List<SystemConfigRemovePartialUploadsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigRemovePartialUploadsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigRemovePartialUploadsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigRemovePartialUploadsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigRemovePartialUploadsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigRemovePartialUploadsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigRemovePartialUploadsDto-objects as value to a dart map
  static Map<String, List<SystemConfigRemovePartialUploadsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigRemovePartialUploadsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigRemovePartialUploadsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'hoursAgo',
  };
}

