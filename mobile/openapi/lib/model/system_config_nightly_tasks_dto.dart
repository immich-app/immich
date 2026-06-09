//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigNightlyTasksDto {
  /// Returns a new [SystemConfigNightlyTasksDto] instance.
  SystemConfigNightlyTasksDto({
    required this.clusterNewFaces,
    required this.databaseCleanup,
    required this.generateMemories,
    required this.missingThumbnails,
    required this.startTime,
    required this.syncQuotaUsage,
  });

  /// Cluster new faces
  bool clusterNewFaces;

  /// Database cleanup
  bool databaseCleanup;

  /// Generate memories
  bool generateMemories;

  /// Missing thumbnails
  bool missingThumbnails;

  /// Start time
  String startTime;

  /// Sync quota usage
  bool syncQuotaUsage;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigNightlyTasksDto &&
    other.clusterNewFaces == clusterNewFaces &&
    other.databaseCleanup == databaseCleanup &&
    other.generateMemories == generateMemories &&
    other.missingThumbnails == missingThumbnails &&
    other.startTime == startTime &&
    other.syncQuotaUsage == syncQuotaUsage;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (clusterNewFaces.hashCode) +
    (databaseCleanup.hashCode) +
    (generateMemories.hashCode) +
    (missingThumbnails.hashCode) +
    (startTime.hashCode) +
    (syncQuotaUsage.hashCode);

  @override
  String toString() => 'SystemConfigNightlyTasksDto[clusterNewFaces=$clusterNewFaces, databaseCleanup=$databaseCleanup, generateMemories=$generateMemories, missingThumbnails=$missingThumbnails, startTime=$startTime, syncQuotaUsage=$syncQuotaUsage]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'clusterNewFaces'] = this.clusterNewFaces;
      json[r'databaseCleanup'] = this.databaseCleanup;
      json[r'generateMemories'] = this.generateMemories;
      json[r'missingThumbnails'] = this.missingThumbnails;
      json[r'startTime'] = this.startTime;
      json[r'syncQuotaUsage'] = this.syncQuotaUsage;
    return json;
  }

  /// Returns a new [SystemConfigNightlyTasksDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigNightlyTasksDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'clusterNewFaces'), 'Required key "SystemConfigNightlyTasksDto[clusterNewFaces]" is missing from JSON.');
        assert(json[r'clusterNewFaces'] != null, 'Required key "SystemConfigNightlyTasksDto[clusterNewFaces]" has a null value in JSON.');
        assert(json.containsKey(r'databaseCleanup'), 'Required key "SystemConfigNightlyTasksDto[databaseCleanup]" is missing from JSON.');
        assert(json[r'databaseCleanup'] != null, 'Required key "SystemConfigNightlyTasksDto[databaseCleanup]" has a null value in JSON.');
        assert(json.containsKey(r'generateMemories'), 'Required key "SystemConfigNightlyTasksDto[generateMemories]" is missing from JSON.');
        assert(json[r'generateMemories'] != null, 'Required key "SystemConfigNightlyTasksDto[generateMemories]" has a null value in JSON.');
        assert(json.containsKey(r'missingThumbnails'), 'Required key "SystemConfigNightlyTasksDto[missingThumbnails]" is missing from JSON.');
        assert(json[r'missingThumbnails'] != null, 'Required key "SystemConfigNightlyTasksDto[missingThumbnails]" has a null value in JSON.');
        assert(json.containsKey(r'startTime'), 'Required key "SystemConfigNightlyTasksDto[startTime]" is missing from JSON.');
        assert(json[r'startTime'] != null, 'Required key "SystemConfigNightlyTasksDto[startTime]" has a null value in JSON.');
        assert(json.containsKey(r'syncQuotaUsage'), 'Required key "SystemConfigNightlyTasksDto[syncQuotaUsage]" is missing from JSON.');
        assert(json[r'syncQuotaUsage'] != null, 'Required key "SystemConfigNightlyTasksDto[syncQuotaUsage]" has a null value in JSON.');
        return true;
      }());

      return SystemConfigNightlyTasksDto(
        clusterNewFaces: mapValueOfType<bool>(json, r'clusterNewFaces')!,
        databaseCleanup: mapValueOfType<bool>(json, r'databaseCleanup')!,
        generateMemories: mapValueOfType<bool>(json, r'generateMemories')!,
        missingThumbnails: mapValueOfType<bool>(json, r'missingThumbnails')!,
        startTime: mapValueOfType<String>(json, r'startTime')!,
        syncQuotaUsage: mapValueOfType<bool>(json, r'syncQuotaUsage')!,
      );
    }
    return null;
  }

  static List<SystemConfigNightlyTasksDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigNightlyTasksDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigNightlyTasksDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigNightlyTasksDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigNightlyTasksDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigNightlyTasksDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigNightlyTasksDto-objects as value to a dart map
  static Map<String, List<SystemConfigNightlyTasksDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigNightlyTasksDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigNightlyTasksDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'clusterNewFaces',
    'databaseCleanup',
    'generateMemories',
    'missingThumbnails',
    'startTime',
    'syncQuotaUsage',
  };
}

