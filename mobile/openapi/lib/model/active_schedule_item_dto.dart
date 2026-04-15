//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActiveScheduleItemDto {
  /// Returns a new [ActiveScheduleItemDto] instance.
  ActiveScheduleItemDto({
    required this.repositoryId,
    required this.status,
  });

  String repositoryId;

  TaskStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActiveScheduleItemDto &&
    other.repositoryId == repositoryId &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (repositoryId.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'ActiveScheduleItemDto[repositoryId=$repositoryId, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'repositoryId'] = this.repositoryId;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [ActiveScheduleItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActiveScheduleItemDto? fromJson(dynamic value) {
    upgradeDto(value, "ActiveScheduleItemDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActiveScheduleItemDto(
        repositoryId: mapValueOfType<String>(json, r'repositoryId')!,
        status: TaskStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<ActiveScheduleItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActiveScheduleItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActiveScheduleItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActiveScheduleItemDto> mapFromJson(dynamic json) {
    final map = <String, ActiveScheduleItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActiveScheduleItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActiveScheduleItemDto-objects as value to a dart map
  static Map<String, List<ActiveScheduleItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActiveScheduleItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActiveScheduleItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'repositoryId',
    'status',
  };
}

