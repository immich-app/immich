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
    required this.id,
    required this.methodName,
    required this.pluginId,
    required this.schema,
    this.supportedContexts = const [],
    required this.title,
  });

  String description;

  String id;

  String methodName;

  String pluginId;

  Object? schema;

  List<PluginContextType> supportedContexts;

  String title;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginActionResponseDto &&
    other.description == description &&
    other.id == id &&
    other.methodName == methodName &&
    other.pluginId == pluginId &&
    other.schema == schema &&
    _deepEquality.equals(other.supportedContexts, supportedContexts) &&
    other.title == title;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (id.hashCode) +
    (methodName.hashCode) +
    (pluginId.hashCode) +
    (schema == null ? 0 : schema!.hashCode) +
    (supportedContexts.hashCode) +
    (title.hashCode);

  @override
  String toString() => 'PluginActionResponseDto[description=$description, id=$id, methodName=$methodName, pluginId=$pluginId, schema=$schema, supportedContexts=$supportedContexts, title=$title]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
      json[r'id'] = this.id;
      json[r'methodName'] = this.methodName;
      json[r'pluginId'] = this.pluginId;
    if (this.schema != null) {
      json[r'schema'] = this.schema;
    } else {
    //  json[r'schema'] = null;
    }
      json[r'supportedContexts'] = this.supportedContexts;
      json[r'title'] = this.title;
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
        id: mapValueOfType<String>(json, r'id')!,
        methodName: mapValueOfType<String>(json, r'methodName')!,
        pluginId: mapValueOfType<String>(json, r'pluginId')!,
        schema: mapValueOfType<Object>(json, r'schema'),
        supportedContexts: PluginContextType.listFromJson(json[r'supportedContexts']),
        title: mapValueOfType<String>(json, r'title')!,
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
    'id',
    'methodName',
    'pluginId',
    'schema',
    'supportedContexts',
    'title',
  };
}

