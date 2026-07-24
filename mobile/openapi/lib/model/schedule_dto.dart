//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScheduleDto {
  /// Returns a new [ScheduleDto] instance.
  ScheduleDto({
    required this.cron,
    required this.id,
    this.lastFinished = const Optional.absent(),
    this.lastRun = const Optional.absent(),
    required this.name,
    required this.paused,
    this.repositories = const [],
  });

  String cron;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> lastFinished;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> lastRun;

  String name;

  bool paused;

  List<String> repositories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScheduleDto &&
    other.cron == cron &&
    other.id == id &&
    other.lastFinished == lastFinished &&
    other.lastRun == lastRun &&
    other.name == name &&
    other.paused == paused &&
    _deepEquality.equals(other.repositories, repositories);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cron.hashCode) +
    (id.hashCode) +
    (lastFinished == null ? 0 : lastFinished!.hashCode) +
    (lastRun == null ? 0 : lastRun!.hashCode) +
    (name.hashCode) +
    (paused.hashCode) +
    (repositories.hashCode);

  @override
  String toString() => 'ScheduleDto[cron=$cron, id=$id, lastFinished=$lastFinished, lastRun=$lastRun, name=$name, paused=$paused, repositories=$repositories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cron'] = this.cron;
      json[r'id'] = this.id;
    if (this.lastFinished.isPresent) {
      final value = this.lastFinished.value;
      json[r'lastFinished'] = value;
    }
    if (this.lastRun.isPresent) {
      final value = this.lastRun.value;
      json[r'lastRun'] = value;
    }
      json[r'name'] = this.name;
      json[r'paused'] = this.paused;
      json[r'repositories'] = this.repositories;
    return json;
  }

  /// Returns a new [ScheduleDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScheduleDto? fromJson(dynamic value) {
    upgradeDto(value, "ScheduleDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScheduleDto(
        cron: mapValueOfType<String>(json, r'cron')!,
        id: mapValueOfType<String>(json, r'id')!,
        lastFinished: json.containsKey(r'lastFinished') ? Optional.present(mapValueOfType<String>(json, r'lastFinished')) : const Optional.absent(),
        lastRun: json.containsKey(r'lastRun') ? Optional.present(mapValueOfType<String>(json, r'lastRun')) : const Optional.absent(),
        name: mapValueOfType<String>(json, r'name')!,
        paused: mapValueOfType<bool>(json, r'paused')!,
        repositories: json[r'repositories'] is Iterable
            ? (json[r'repositories'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<ScheduleDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScheduleDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScheduleDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScheduleDto> mapFromJson(dynamic json) {
    final map = <String, ScheduleDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScheduleDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScheduleDto-objects as value to a dart map
  static Map<String, List<ScheduleDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScheduleDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScheduleDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cron',
    'id',
    'name',
    'paused',
    'repositories',
  };
}

