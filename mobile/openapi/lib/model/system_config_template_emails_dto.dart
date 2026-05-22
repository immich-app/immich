//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigTemplateEmailsDto {
  /// Returns a new [SystemConfigTemplateEmailsDto] instance.
  SystemConfigTemplateEmailsDto({
    required this.albumInviteTemplate,
    required this.albumUpdateTemplate,
    required this.welcomeTemplate,
  });

  String albumInviteTemplate;

  String albumUpdateTemplate;

  String welcomeTemplate;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigTemplateEmailsDto &&
    other.albumInviteTemplate == albumInviteTemplate &&
    other.albumUpdateTemplate == albumUpdateTemplate &&
    other.welcomeTemplate == welcomeTemplate;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumInviteTemplate.hashCode) +
    (albumUpdateTemplate.hashCode) +
    (welcomeTemplate.hashCode);

  @override
  String toString() => 'SystemConfigTemplateEmailsDto[albumInviteTemplate=$albumInviteTemplate, albumUpdateTemplate=$albumUpdateTemplate, welcomeTemplate=$welcomeTemplate]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumInviteTemplate'] = this.albumInviteTemplate;
      json[r'albumUpdateTemplate'] = this.albumUpdateTemplate;
      json[r'welcomeTemplate'] = this.welcomeTemplate;
    return json;
  }

  /// Returns a new [SystemConfigTemplateEmailsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigTemplateEmailsDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigTemplateEmailsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigTemplateEmailsDto(
        albumInviteTemplate: mapValueOfType<String>(json, r'albumInviteTemplate')!,
        albumUpdateTemplate: mapValueOfType<String>(json, r'albumUpdateTemplate')!,
        welcomeTemplate: mapValueOfType<String>(json, r'welcomeTemplate')!,
      );
    }
    return null;
  }

  static List<SystemConfigTemplateEmailsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigTemplateEmailsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigTemplateEmailsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigTemplateEmailsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigTemplateEmailsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigTemplateEmailsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigTemplateEmailsDto-objects as value to a dart map
  static Map<String, List<SystemConfigTemplateEmailsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigTemplateEmailsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigTemplateEmailsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumInviteTemplate',
    'albumUpdateTemplate',
    'welcomeTemplate',
  };
}

