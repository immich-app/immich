//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueStatisticsDto {
  /// Returns a new [QueueStatisticsDto] instance.
  QueueStatisticsDto({
    required this.active,
    required this.completed,
    required this.delayed,
    required this.failed,
    required this.paused,
    required this.waiting,
  });

  /// Number of active jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int active;

  /// Number of completed jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int completed;

  /// Number of delayed jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int delayed;

  /// Number of failed jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int failed;

  /// Number of paused jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int paused;

  /// Number of waiting jobs
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int waiting;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueStatisticsDto &&
    other.active == active &&
    other.completed == completed &&
    other.delayed == delayed &&
    other.failed == failed &&
    other.paused == paused &&
    other.waiting == waiting;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (active.hashCode) +
    (completed.hashCode) +
    (delayed.hashCode) +
    (failed.hashCode) +
    (paused.hashCode) +
    (waiting.hashCode);

  @override
  String toString() => 'QueueStatisticsDto[active=$active, completed=$completed, delayed=$delayed, failed=$failed, paused=$paused, waiting=$waiting]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'active'] = this.active;
      json[r'completed'] = this.completed;
      json[r'delayed'] = this.delayed;
      json[r'failed'] = this.failed;
      json[r'paused'] = this.paused;
      json[r'waiting'] = this.waiting;
    return json;
  }

  /// Returns a new [QueueStatisticsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueStatisticsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'active'), 'Required key "QueueStatisticsDto[active]" is missing from JSON.');
        assert(json[r'active'] != null, 'Required key "QueueStatisticsDto[active]" has a null value in JSON.');
        assert(json.containsKey(r'completed'), 'Required key "QueueStatisticsDto[completed]" is missing from JSON.');
        assert(json[r'completed'] != null, 'Required key "QueueStatisticsDto[completed]" has a null value in JSON.');
        assert(json.containsKey(r'delayed'), 'Required key "QueueStatisticsDto[delayed]" is missing from JSON.');
        assert(json[r'delayed'] != null, 'Required key "QueueStatisticsDto[delayed]" has a null value in JSON.');
        assert(json.containsKey(r'failed'), 'Required key "QueueStatisticsDto[failed]" is missing from JSON.');
        assert(json[r'failed'] != null, 'Required key "QueueStatisticsDto[failed]" has a null value in JSON.');
        assert(json.containsKey(r'paused'), 'Required key "QueueStatisticsDto[paused]" is missing from JSON.');
        assert(json[r'paused'] != null, 'Required key "QueueStatisticsDto[paused]" has a null value in JSON.');
        assert(json.containsKey(r'waiting'), 'Required key "QueueStatisticsDto[waiting]" is missing from JSON.');
        assert(json[r'waiting'] != null, 'Required key "QueueStatisticsDto[waiting]" has a null value in JSON.');
        return true;
      }());

      return QueueStatisticsDto(
        active: mapValueOfType<int>(json, r'active')!,
        completed: mapValueOfType<int>(json, r'completed')!,
        delayed: mapValueOfType<int>(json, r'delayed')!,
        failed: mapValueOfType<int>(json, r'failed')!,
        paused: mapValueOfType<int>(json, r'paused')!,
        waiting: mapValueOfType<int>(json, r'waiting')!,
      );
    }
    return null;
  }

  static List<QueueStatisticsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueStatisticsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueStatisticsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueStatisticsDto> mapFromJson(dynamic json) {
    final map = <String, QueueStatisticsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueStatisticsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueStatisticsDto-objects as value to a dart map
  static Map<String, List<QueueStatisticsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueStatisticsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueStatisticsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'active',
    'completed',
    'delayed',
    'failed',
    'paused',
    'waiting',
  };
}

