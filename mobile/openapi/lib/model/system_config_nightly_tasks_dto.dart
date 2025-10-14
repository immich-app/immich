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

  bool clusterNewFaces;

  bool databaseCleanup;

  bool generateMemories;

  bool missingThumbnails;

  String startTime;

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
    upgradeDto(value, "SystemConfigNightlyTasksDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

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

