//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueJobTypeCountsDto {
  /// Returns a new [QueueJobTypeCountsDto] instance.
  QueueJobTypeCountsDto({
    required this.active,
    required this.delayed,
    required this.name,
    required this.paused,
    required this.waiting,
  });

  /// Number of sampled active jobs with this name
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int active;

  /// Number of sampled delayed jobs with this name
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int delayed;

  JobName name;

  /// Number of sampled paused jobs with this name
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int paused;

  /// Number of sampled waiting jobs with this name
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int waiting;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueJobTypeCountsDto &&
    other.active == active &&
    other.delayed == delayed &&
    other.name == name &&
    other.paused == paused &&
    other.waiting == waiting;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (active.hashCode) +
    (delayed.hashCode) +
    (name.hashCode) +
    (paused.hashCode) +
    (waiting.hashCode);

  @override
  String toString() => 'QueueJobTypeCountsDto[active=$active, delayed=$delayed, name=$name, paused=$paused, waiting=$waiting]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'active'] = this.active;
      json[r'delayed'] = this.delayed;
      json[r'name'] = this.name;
      json[r'paused'] = this.paused;
      json[r'waiting'] = this.waiting;
    return json;
  }

  /// Returns a new [QueueJobTypeCountsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueJobTypeCountsDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueJobTypeCountsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueJobTypeCountsDto(
        active: mapValueOfType<int>(json, r'active')!,
        delayed: mapValueOfType<int>(json, r'delayed')!,
        name: JobName.fromJson(json[r'name'])!,
        paused: mapValueOfType<int>(json, r'paused')!,
        waiting: mapValueOfType<int>(json, r'waiting')!,
      );
    }
    return null;
  }

  static List<QueueJobTypeCountsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueJobTypeCountsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueJobTypeCountsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueJobTypeCountsDto> mapFromJson(dynamic json) {
    final map = <String, QueueJobTypeCountsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueJobTypeCountsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueJobTypeCountsDto-objects as value to a dart map
  static Map<String, List<QueueJobTypeCountsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueJobTypeCountsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueJobTypeCountsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'active',
    'delayed',
    'name',
    'paused',
    'waiting',
  };
}

