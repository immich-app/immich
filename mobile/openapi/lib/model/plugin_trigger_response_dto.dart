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
    required this.contextType,
    required this.description,
    required this.name,
    required this.type,
  });

  PluginContextType contextType;

  String description;

  String name;

  PluginTriggerType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginTriggerResponseDto &&
    other.contextType == contextType &&
    other.description == description &&
    other.name == name &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (contextType.hashCode) +
    (description.hashCode) +
    (name.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'PluginTriggerResponseDto[contextType=$contextType, description=$description, name=$name, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'contextType'] = this.contextType;
      json[r'description'] = this.description;
      json[r'name'] = this.name;
      json[r'type'] = this.type;
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
        contextType: PluginContextType.fromJson(json[r'contextType'])!,
        description: mapValueOfType<String>(json, r'description')!,
        name: mapValueOfType<String>(json, r'name')!,
        type: PluginTriggerType.fromJson(json[r'type'])!,
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
    'contextType',
    'description',
    'name',
    'type',
  };
}

