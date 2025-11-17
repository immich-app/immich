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

  int active;

  int completed;

  int delayed;

  int failed;

  int paused;

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
    upgradeDto(value, "QueueStatisticsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

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

