//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigMemoriesDto {
  /// Returns a new [SystemConfigMemoriesDto] instance.
  SystemConfigMemoriesDto({
    required this.birthday,
    required this.recentTrips,
    required this.retentionDays,
  });

  /// Birthday memories
  bool birthday;

  /// Recent trip memories
  bool recentTrips;

  /// Retention days
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int retentionDays;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigMemoriesDto &&
    other.birthday == birthday &&
    other.recentTrips == recentTrips &&
    other.retentionDays == retentionDays;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthday.hashCode) +
    (recentTrips.hashCode) +
    (retentionDays.hashCode);

  @override
  String toString() => 'SystemConfigMemoriesDto[birthday=$birthday, recentTrips=$recentTrips, retentionDays=$retentionDays]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'birthday'] = this.birthday;
      json[r'recentTrips'] = this.recentTrips;
      json[r'retentionDays'] = this.retentionDays;
    return json;
  }

  /// Returns a new [SystemConfigMemoriesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigMemoriesDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigMemoriesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigMemoriesDto(
        birthday: mapValueOfType<bool>(json, r'birthday')!,
        recentTrips: mapValueOfType<bool>(json, r'recentTrips')!,
        retentionDays: mapValueOfType<int>(json, r'retentionDays')!,
      );
    }
    return null;
  }

  static List<SystemConfigMemoriesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigMemoriesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigMemoriesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigMemoriesDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigMemoriesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigMemoriesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigMemoriesDto-objects as value to a dart map
  static Map<String, List<SystemConfigMemoriesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigMemoriesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigMemoriesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthday',
    'recentTrips',
    'retentionDays',
  };
}

