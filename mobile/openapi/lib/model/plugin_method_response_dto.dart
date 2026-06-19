//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginMethodResponseDto {
  /// Returns a new [PluginMethodResponseDto] instance.
  PluginMethodResponseDto({
    required this.description,
    required this.hostFunctions,
    required this.key,
    required this.name,
    this.schema = const Optional.absent(),
    required this.title,
    this.types = const [],
    this.uiHints = const [],
  });

  /// Description
  String description;

  bool hostFunctions;

  /// Key
  String key;

  /// Name
  String name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<Object?> schema;

  /// Title
  String title;

  /// Workflow types
  List<WorkflowType> types;

  /// Ui hints
  List<String> uiHints;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginMethodResponseDto &&
    other.description == description &&
    other.hostFunctions == hostFunctions &&
    other.key == key &&
    other.name == name &&
    other.schema == schema &&
    other.title == title &&
    _deepEquality.equals(other.types, types) &&
    _deepEquality.equals(other.uiHints, uiHints);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description.hashCode) +
    (hostFunctions.hashCode) +
    (key.hashCode) +
    (name.hashCode) +
    (schema == null ? 0 : schema!.hashCode) +
    (title.hashCode) +
    (types.hashCode) +
    (uiHints.hashCode);

  @override
  String toString() => 'PluginMethodResponseDto[description=$description, hostFunctions=$hostFunctions, key=$key, name=$name, schema=$schema, title=$title, types=$types, uiHints=$uiHints]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'description'] = this.description;
      json[r'hostFunctions'] = this.hostFunctions;
      json[r'key'] = this.key;
      json[r'name'] = this.name;
    if (this.schema.isPresent) {
      final value = this.schema.value;
      json[r'schema'] = value;
    }
      json[r'title'] = this.title;
      json[r'types'] = this.types;
      json[r'uiHints'] = this.uiHints;
    return json;
  }

  /// Returns a new [PluginMethodResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginMethodResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginMethodResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginMethodResponseDto(
        description: mapValueOfType<String>(json, r'description')!,
        hostFunctions: mapValueOfType<bool>(json, r'hostFunctions')!,
        key: mapValueOfType<String>(json, r'key')!,
        name: mapValueOfType<String>(json, r'name')!,
        schema: json.containsKey(r'schema') ? Optional.present(mapValueOfType<Object>(json, r'schema')) : const Optional.absent(),
        title: mapValueOfType<String>(json, r'title')!,
        types: WorkflowType.listFromJson(json[r'types']),
        uiHints: json[r'uiHints'] is Iterable
            ? (json[r'uiHints'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<PluginMethodResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginMethodResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginMethodResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginMethodResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginMethodResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginMethodResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginMethodResponseDto-objects as value to a dart map
  static Map<String, List<PluginMethodResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginMethodResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginMethodResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'description',
    'hostFunctions',
    'key',
    'name',
    'title',
    'types',
    'uiHints',
  };
}

