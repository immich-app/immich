//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class InspectedLocalRepositoryDto {
  /// Returns a new [InspectedLocalRepositoryDto] instance.
  InspectedLocalRepositoryDto({
    this.backends = const Optional.absent(),
    this.configuration = const Optional.absent(),
    required this.id,
    this.meter = const Optional.absent(),
    required this.metrics,
    required this.name,
    this.snapshots = const [],
    required this.worm,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<RepositoryBackendsDto?> backends;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<RepositoryConfigurationDto?> configuration;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<RepositoryMeterDto?> meter;

  RepositoryMetricsDto metrics;

  String name;

  List<SnapshotDto> snapshots;

  bool worm;

  @override
  bool operator ==(Object other) => identical(this, other) || other is InspectedLocalRepositoryDto &&
    other.backends == backends &&
    other.configuration == configuration &&
    other.id == id &&
    other.meter == meter &&
    other.metrics == metrics &&
    other.name == name &&
    _deepEquality.equals(other.snapshots, snapshots) &&
    other.worm == worm;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backends == null ? 0 : backends!.hashCode) +
    (configuration == null ? 0 : configuration!.hashCode) +
    (id.hashCode) +
    (meter == null ? 0 : meter!.hashCode) +
    (metrics.hashCode) +
    (name.hashCode) +
    (snapshots.hashCode) +
    (worm.hashCode);

  @override
  String toString() => 'InspectedLocalRepositoryDto[backends=$backends, configuration=$configuration, id=$id, meter=$meter, metrics=$metrics, name=$name, snapshots=$snapshots, worm=$worm]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.backends.isPresent) {
      final value = this.backends.value;
      json[r'backends'] = value;
    }
    if (this.configuration.isPresent) {
      final value = this.configuration.value;
      json[r'configuration'] = value;
    }
      json[r'id'] = this.id;
    if (this.meter.isPresent) {
      final value = this.meter.value;
      json[r'meter'] = value;
    }
      json[r'metrics'] = this.metrics;
      json[r'name'] = this.name;
      json[r'snapshots'] = this.snapshots;
      json[r'worm'] = this.worm;
    return json;
  }

  /// Returns a new [InspectedLocalRepositoryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static InspectedLocalRepositoryDto? fromJson(dynamic value) {
    upgradeDto(value, "InspectedLocalRepositoryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return InspectedLocalRepositoryDto(
        backends: json.containsKey(r'backends') ? Optional.present(RepositoryBackendsDto.fromJson(json[r'backends'])) : const Optional.absent(),
        configuration: json.containsKey(r'configuration') ? Optional.present(RepositoryConfigurationDto.fromJson(json[r'configuration'])) : const Optional.absent(),
        id: mapValueOfType<String>(json, r'id')!,
        meter: json.containsKey(r'meter') ? Optional.present(RepositoryMeterDto.fromJson(json[r'meter'])) : const Optional.absent(),
        metrics: RepositoryMetricsDto.fromJson(json[r'metrics'])!,
        name: mapValueOfType<String>(json, r'name')!,
        snapshots: SnapshotDto.listFromJson(json[r'snapshots']),
        worm: mapValueOfType<bool>(json, r'worm')!,
      );
    }
    return null;
  }

  static List<InspectedLocalRepositoryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <InspectedLocalRepositoryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = InspectedLocalRepositoryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, InspectedLocalRepositoryDto> mapFromJson(dynamic json) {
    final map = <String, InspectedLocalRepositoryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = InspectedLocalRepositoryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of InspectedLocalRepositoryDto-objects as value to a dart map
  static Map<String, List<InspectedLocalRepositoryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<InspectedLocalRepositoryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = InspectedLocalRepositoryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'metrics',
    'name',
    'snapshots',
    'worm',
  };
}

