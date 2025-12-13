//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigNotificationsDto {
  /// Returns a new [SystemConfigNotificationsDto] instance.
  SystemConfigNotificationsDto({
    required this.smtp,
  });

  SystemConfigSmtpDto smtp;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigNotificationsDto &&
    other.smtp == smtp;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (smtp.hashCode);

  @override
  String toString() => 'SystemConfigNotificationsDto[smtp=$smtp]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'smtp'] = this.smtp;
    return json;
  }

  /// Returns a new [SystemConfigNotificationsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigNotificationsDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigNotificationsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigNotificationsDto(
        smtp: SystemConfigSmtpDto.fromJson(json[r'smtp'])!,
      );
    }
    return null;
  }

  static List<SystemConfigNotificationsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigNotificationsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigNotificationsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigNotificationsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigNotificationsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigNotificationsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigNotificationsDto-objects as value to a dart map
  static Map<String, List<SystemConfigNotificationsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigNotificationsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigNotificationsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'smtp',
  };
}

