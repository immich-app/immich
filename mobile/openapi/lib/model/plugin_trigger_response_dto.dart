//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginTriggerResponseDto {
  /// Returns a new [PluginTriggerResponseDto] instance.
  PluginTriggerResponseDto({
    required this.context,
    required this.description,
    required this.name,
    required this.schema,
  });

  PluginContext context;

  String description;

  String name;

  Object? schema;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginTriggerResponseDto &&
    other.context == context &&
    other.description == description &&
    other.name == name &&
    other.schema == schema;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (context.hashCode) +
    (description.hashCode) +
    (name.hashCode) +
    (schema == null ? 0 : schema!.hashCode);

  @override
  String toString() => 'PluginTriggerResponseDto[context=$context, description=$description, name=$name, schema=$schema]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'context'] = this.context;
      json[r'description'] = this.description;
      json[r'name'] = this.name;
    if (this.schema != null) {
      json[r'schema'] = this.schema;
    } else {
    //  json[r'schema'] = null;
    }
    return json;
  }

  /// Returns a new [PluginTriggerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginTriggerResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginTriggerResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginTriggerResponseDto(
        context: PluginContext.fromJson(json[r'context'])!,
        description: mapValueOfType<String>(json, r'description')!,
        name: mapValueOfType<String>(json, r'name')!,
        schema: mapValueOfType<Object>(json, r'schema'),
      );
    }
    return null;
  }

  static List<PluginTriggerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginTriggerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginTriggerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginTriggerResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginTriggerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginTriggerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginTriggerResponseDto-objects as value to a dart map
  static Map<String, List<PluginTriggerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginTriggerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginTriggerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'context',
    'description',
    'name',
    'schema',
  };
}

