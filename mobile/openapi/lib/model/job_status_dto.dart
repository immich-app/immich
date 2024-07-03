//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class JobStatusDto {
  /// Returns a new [JobStatusDto] instance.
  JobStatusDto({
    required this.jobCounts,
    required this.queueStatus,
  });

  JobCountsDto jobCounts;

  QueueStatusDto queueStatus;

  @override
  bool operator ==(Object other) => identical(this, other) || other is JobStatusDto &&
    other.jobCounts == jobCounts &&
    other.queueStatus == queueStatus;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (jobCounts.hashCode) +
    (queueStatus.hashCode);

  @override
  String toString() => 'JobStatusDto[jobCounts=$jobCounts, queueStatus=$queueStatus]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'jobCounts'] = this.jobCounts;
      json[r'queueStatus'] = this.queueStatus;
    return json;
  }

  /// Returns a new [JobStatusDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static JobStatusDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return JobStatusDto(
        jobCounts: JobCountsDto.fromJson(json[r'jobCounts'])!,
        queueStatus: QueueStatusDto.fromJson(json[r'queueStatus'])!,
      );
    }
    return null;
  }

  static List<JobStatusDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <JobStatusDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = JobStatusDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, JobStatusDto> mapFromJson(dynamic json) {
    final map = <String, JobStatusDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = JobStatusDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of JobStatusDto-objects as value to a dart map
  static Map<String, List<JobStatusDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<JobStatusDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = JobStatusDto.listFromJson(entry.value, growable: growable,);
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

