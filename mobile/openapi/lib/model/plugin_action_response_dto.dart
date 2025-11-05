//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginActionResponseDto {
  /// Returns a new [PluginActionResponseDto] instance.
  PluginActionResponseDto({
    required this.description,
    required this.displayName,
    required this.id,
    required this.name,
    required this.pluginId,
    required this.schema,
    this.supportedContexts = const [],
  });

  String description;

  String displayName;

  String id;

  String name;

  String pluginId;

  Object? schema;

  List<PluginContext> supportedContexts;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginActionResponseDto &&
    other.description == description &&
    other.displayName == displayName &&
    other.id == id &&
    other.name == name &&
    other.pluginId == pluginId &&
    other.schema == schema &&
    _deepEquality.equals(other.supportedContexts, supportedContexts);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (displayName.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (pluginId.hashCode) +
    (schema == null ? 0 : schema!.hashCode) +
    (supportedContexts.hashCode);

  @override
  String toString() => 'PluginActionResponseDto[description=$description, displayName=$displayName, id=$id, name=$name, pluginId=$pluginId, schema=$schema, supportedContexts=$supportedContexts]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
      json[r'displayName'] = this.displayName;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'pluginId'] = this.pluginId;
    if (this.schema != null) {
      json[r'schema'] = this.schema;
    } else {
    //  json[r'schema'] = null;
    }
      json[r'supportedContexts'] = this.supportedContexts;
    return json;
  }

  /// Returns a new [PluginActionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginActionResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginActionResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginActionResponseDto(
        description: mapValueOfType<String>(json, r'description')!,
        displayName: mapValueOfType<String>(json, r'displayName')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        pluginId: mapValueOfType<String>(json, r'pluginId')!,
        schema: mapValueOfType<Object>(json, r'schema'),
        supportedContexts: PluginContext.listFromJson(json[r'supportedContexts']),
      );
    }
    return null;
  }

  static List<PluginActionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginActionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginActionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginActionResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginActionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginActionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginActionResponseDto-objects as value to a dart map
  static Map<String, List<PluginActionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginActionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginActionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'displayName',
    'id',
    'name',
    'pluginId',
    'schema',
    'supportedContexts',
  };
}

