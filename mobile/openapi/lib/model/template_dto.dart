//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TemplateDto {
  /// Returns a new [TemplateDto] instance.
  TemplateDto({
    required this.template,
  });

  String template;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TemplateDto &&
    other.template == template;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (template.hashCode);

  @override
  String toString() => 'TemplateDto[template=$template]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'template'] = this.template;
    return json;
  }

  /// Returns a new [TemplateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TemplateDto? fromJson(dynamic value) {
    upgradeDto(value, "TemplateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TemplateDto(
        template: mapValueOfType<String>(json, r'template')!,
      );
    }
    return null;
  }

  static List<TemplateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TemplateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TemplateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TemplateDto> mapFromJson(dynamic json) {
    final map = <String, TemplateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TemplateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TemplateDto-objects as value to a dart map
  static Map<String, List<TemplateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TemplateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TemplateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'template',
  };
}

