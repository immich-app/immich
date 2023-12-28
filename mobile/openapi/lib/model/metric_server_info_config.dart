//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MetricServerInfoConfig {
  /// Returns a new [MetricServerInfoConfig] instance.
  MetricServerInfoConfig({
    required this.cpuCount,
    required this.cpuModel,
    required this.memory,
    required this.version,
  });

  bool cpuCount;

  bool cpuModel;

  bool memory;

  bool version;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MetricServerInfoConfig &&
     other.cpuCount == cpuCount &&
     other.cpuModel == cpuModel &&
     other.memory == memory &&
     other.version == version;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cpuCount.hashCode) +
    (cpuModel.hashCode) +
    (memory.hashCode) +
    (version.hashCode);

  @override
  String toString() => 'MetricServerInfoConfig[cpuCount=$cpuCount, cpuModel=$cpuModel, memory=$memory, version=$version]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cpuCount'] = this.cpuCount;
      json[r'cpuModel'] = this.cpuModel;
      json[r'memory'] = this.memory;
      json[r'version'] = this.version;
    return json;
  }

  /// Returns a new [MetricServerInfoConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MetricServerInfoConfig? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MetricServerInfoConfig(
        cpuCount: mapValueOfType<bool>(json, r'cpuCount')!,
        cpuModel: mapValueOfType<bool>(json, r'cpuModel')!,
        memory: mapValueOfType<bool>(json, r'memory')!,
        version: mapValueOfType<bool>(json, r'version')!,
      );
    }
    return null;
  }

  static List<MetricServerInfoConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MetricServerInfoConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MetricServerInfoConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MetricServerInfoConfig> mapFromJson(dynamic json) {
    final map = <String, MetricServerInfoConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MetricServerInfoConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MetricServerInfoConfig-objects as value to a dart map
  static Map<String, List<MetricServerInfoConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MetricServerInfoConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MetricServerInfoConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cpuCount',
    'cpuModel',
    'memory',
    'version',
  };
}

