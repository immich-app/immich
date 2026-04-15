//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LocalRepositoryDto {
  /// Returns a new [LocalRepositoryDto] instance.
  LocalRepositoryDto({
    this.backends,
    this.configuration,
    required this.id,
    required this.metrics,
    required this.name,
    required this.worm,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  RepositoryBackendsDto? backends;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  RepositoryConfigurationDto? configuration;

  String id;

  RepositoryMetricsDto metrics;

  String name;

  bool worm;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LocalRepositoryDto &&
    other.backends == backends &&
    other.configuration == configuration &&
    other.id == id &&
    other.metrics == metrics &&
    other.name == name &&
    other.worm == worm;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backends == null ? 0 : backends!.hashCode) +
    (configuration == null ? 0 : configuration!.hashCode) +
    (id.hashCode) +
    (metrics.hashCode) +
    (name.hashCode) +
    (worm.hashCode);

  @override
  String toString() => 'LocalRepositoryDto[backends=$backends, configuration=$configuration, id=$id, metrics=$metrics, name=$name, worm=$worm]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.backends != null) {
      json[r'backends'] = this.backends;
    } else {
    //  json[r'backends'] = null;
    }
    if (this.configuration != null) {
      json[r'configuration'] = this.configuration;
    } else {
    //  json[r'configuration'] = null;
    }
      json[r'id'] = this.id;
      json[r'metrics'] = this.metrics;
      json[r'name'] = this.name;
      json[r'worm'] = this.worm;
    return json;
  }

  /// Returns a new [LocalRepositoryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LocalRepositoryDto? fromJson(dynamic value) {
    upgradeDto(value, "LocalRepositoryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LocalRepositoryDto(
        backends: RepositoryBackendsDto.fromJson(json[r'backends']),
        configuration: RepositoryConfigurationDto.fromJson(json[r'configuration']),
        id: mapValueOfType<String>(json, r'id')!,
        metrics: RepositoryMetricsDto.fromJson(json[r'metrics'])!,
        name: mapValueOfType<String>(json, r'name')!,
        worm: mapValueOfType<bool>(json, r'worm')!,
      );
    }
    return null;
  }

  static List<LocalRepositoryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LocalRepositoryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LocalRepositoryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LocalRepositoryDto> mapFromJson(dynamic json) {
    final map = <String, LocalRepositoryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LocalRepositoryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LocalRepositoryDto-objects as value to a dart map
  static Map<String, List<LocalRepositoryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LocalRepositoryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LocalRepositoryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'metrics',
    'name',
    'worm',
  };
}

