//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigTemplatesDto {
  /// Returns a new [SystemConfigTemplatesDto] instance.
  SystemConfigTemplatesDto({
    required this.email,
  });

  SystemConfigTemplateEmailsDto email;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigTemplatesDto &&
    other.email == email;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (email.hashCode);

  @override
  String toString() => 'SystemConfigTemplatesDto[email=$email]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'email'] = this.email;
    return json;
  }

  /// Returns a new [SystemConfigTemplatesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigTemplatesDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigTemplatesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigTemplatesDto(
        email: SystemConfigTemplateEmailsDto.fromJson(json[r'email'])!,
      );
    }
    return null;
  }

  static List<SystemConfigTemplatesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigTemplatesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigTemplatesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigTemplatesDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigTemplatesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigTemplatesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigTemplatesDto-objects as value to a dart map
  static Map<String, List<SystemConfigTemplatesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigTemplatesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigTemplatesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'email',
  };
}

