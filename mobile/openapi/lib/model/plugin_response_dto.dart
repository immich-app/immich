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
    required this.author,
    required this.createdAt,
    required this.description,
    required this.id,
    this.methods = const [],
    required this.name,
    required this.title,
    required this.updatedAt,
    required this.version,
  });

  /// Plugin author
  String author;

  /// Creation date
  String createdAt;

  /// Plugin description
  String description;

  /// Plugin ID
  String id;

  /// Plugin methods
  List<PluginMethodResponseDto> methods;

  /// Plugin name
  String name;

  /// Plugin title
  String title;

  /// Last update date
  String updatedAt;

  /// Plugin version
  String version;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PluginResponseDto &&
    other.author == author &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.id == id &&
    _deepEquality.equals(other.methods, methods) &&
    other.name == name &&
    other.title == title &&
    other.updatedAt == updatedAt &&
    other.version == version;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (author.hashCode) +
    (createdAt.hashCode) +
    (description.hashCode) +
    (id.hashCode) +
    (methods.hashCode) +
    (name.hashCode) +
    (title.hashCode) +
    (updatedAt.hashCode) +
    (version.hashCode);

  @override
  String toString() => 'PluginResponseDto[author=$author, createdAt=$createdAt, description=$description, id=$id, methods=$methods, name=$name, title=$title, updatedAt=$updatedAt, version=$version]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'author'] = this.author;
      json[r'createdAt'] = this.createdAt;
      json[r'description'] = this.description;
      json[r'id'] = this.id;
      json[r'methods'] = this.methods;
      json[r'name'] = this.name;
      json[r'title'] = this.title;
      json[r'updatedAt'] = this.updatedAt;
      json[r'version'] = this.version;
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
        author: mapValueOfType<String>(json, r'author')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        description: mapValueOfType<String>(json, r'description')!,
        id: mapValueOfType<String>(json, r'id')!,
        methods: PluginMethodResponseDto.listFromJson(json[r'methods']),
        name: mapValueOfType<String>(json, r'name')!,
        title: mapValueOfType<String>(json, r'title')!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
        version: mapValueOfType<String>(json, r'version')!,
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
    'author',
    'createdAt',
    'description',
    'id',
    'methods',
    'name',
    'title',
    'updatedAt',
    'version',
  };
}

