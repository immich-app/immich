//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueResponseLegacyDto {
  /// Returns a new [QueueResponseLegacyDto] instance.
  QueueResponseLegacyDto({
    required this.jobCounts,
    required this.queueStatus,
  });

  QueueStatisticsDto jobCounts;

  QueueStatusLegacyDto queueStatus;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueResponseLegacyDto &&
    other.jobCounts == jobCounts &&
    other.queueStatus == queueStatus;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (jobCounts.hashCode) +
    (queueStatus.hashCode);

  @override
  String toString() => 'QueueResponseLegacyDto[jobCounts=$jobCounts, queueStatus=$queueStatus]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'jobCounts'] = this.jobCounts;
      json[r'queueStatus'] = this.queueStatus;
    return json;
  }

  /// Returns a new [QueueResponseLegacyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueResponseLegacyDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueResponseLegacyDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueResponseLegacyDto(
        jobCounts: QueueStatisticsDto.fromJson(json[r'jobCounts'])!,
        queueStatus: QueueStatusLegacyDto.fromJson(json[r'queueStatus'])!,
      );
    }
    return null;
  }

  static List<QueueResponseLegacyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueResponseLegacyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueResponseLegacyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueResponseLegacyDto> mapFromJson(dynamic json) {
    final map = <String, QueueResponseLegacyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueResponseLegacyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueResponseLegacyDto-objects as value to a dart map
  static Map<String, List<QueueResponseLegacyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueResponseLegacyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueResponseLegacyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'jobCounts',
    'queueStatus',
  };
}

