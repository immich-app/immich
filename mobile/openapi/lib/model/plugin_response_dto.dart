//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PluginResponseDto {
  /// Returns a new [PluginResponseDto] instance.
  PluginResponseDto({
    this.actions = const [],
    required this.author,
    required this.createdAt,
    required this.description,
    required this.displayName,
    this.filters = const [],
    required this.id,
    required this.name,
    this.triggers = const [],
    required this.updatedAt,
    required this.version,
    required this.wasmPath,
  });

  List<PluginActionResponseDto> actions;

  String author;

  String createdAt;

  String description;

  String displayName;

  List<PluginFilterResponseDto> filters;

  String id;

  String name;

  List<PluginTriggerResponseDto> triggers;

  String updatedAt;

  String version;

  String wasmPath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginResponseDto &&
    _deepEquality.equals(other.actions, actions) &&
    other.author == author &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.displayName == displayName &&
    _deepEquality.equals(other.filters, filters) &&
    other.id == id &&
    other.name == name &&
    _deepEquality.equals(other.triggers, triggers) &&
    other.updatedAt == updatedAt &&
    other.version == version &&
    other.wasmPath == wasmPath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actions.hashCode) +
    (author.hashCode) +
    (createdAt.hashCode) +
    (description.hashCode) +
    (displayName.hashCode) +
    (filters.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (triggers.hashCode) +
    (updatedAt.hashCode) +
    (version.hashCode) +
    (wasmPath.hashCode);

  @override
  String toString() => 'PluginResponseDto[actions=$actions, author=$author, createdAt=$createdAt, description=$description, displayName=$displayName, filters=$filters, id=$id, name=$name, triggers=$triggers, updatedAt=$updatedAt, version=$version, wasmPath=$wasmPath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'actions'] = this.actions;
      json[r'author'] = this.author;
      json[r'createdAt'] = this.createdAt;
      json[r'description'] = this.description;
      json[r'displayName'] = this.displayName;
      json[r'filters'] = this.filters;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'triggers'] = this.triggers;
      json[r'updatedAt'] = this.updatedAt;
      json[r'version'] = this.version;
      json[r'wasmPath'] = this.wasmPath;
    return json;
  }

  /// Returns a new [PluginResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PluginResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PluginResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PluginResponseDto(
        actions: PluginActionResponseDto.listFromJson(json[r'actions']),
        author: mapValueOfType<String>(json, r'author')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        description: mapValueOfType<String>(json, r'description')!,
        displayName: mapValueOfType<String>(json, r'displayName')!,
        filters: PluginFilterResponseDto.listFromJson(json[r'filters']),
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        triggers: PluginTriggerResponseDto.listFromJson(json[r'triggers']),
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
        version: mapValueOfType<String>(json, r'version')!,
        wasmPath: mapValueOfType<String>(json, r'wasmPath')!,
      );
    }
    return null;
  }

  static List<PluginResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PluginResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PluginResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PluginResponseDto> mapFromJson(dynamic json) {
    final map = <String, PluginResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PluginResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PluginResponseDto-objects as value to a dart map
  static Map<String, List<PluginResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PluginResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PluginResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'actions',
    'author',
    'createdAt',
    'description',
    'displayName',
    'filters',
    'id',
    'name',
    'triggers',
    'updatedAt',
    'version',
    'wasmPath',
  };
}

