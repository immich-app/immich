//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScheduleCreateRequestDto {
  /// Returns a new [ScheduleCreateRequestDto] instance.
  ScheduleCreateRequestDto({
    required this.cron,
    required this.name,
    this.repositories = const [],
  });

  String cron;

  String name;

  List<String> repositories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScheduleCreateRequestDto &&
    other.cron == cron &&
    other.name == name &&
    _deepEquality.equals(other.repositories, repositories);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cron.hashCode) +
    (name.hashCode) +
    (repositories.hashCode);

  @override
  String toString() => 'ScheduleCreateRequestDto[cron=$cron, name=$name, repositories=$repositories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cron'] = this.cron;
      json[r'name'] = this.name;
      json[r'repositories'] = this.repositories;
    return json;
  }

  /// Returns a new [ScheduleCreateRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScheduleCreateRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "ScheduleCreateRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScheduleCreateRequestDto(
        cron: mapValueOfType<String>(json, r'cron')!,
        name: mapValueOfType<String>(json, r'name')!,
        repositories: json[r'repositories'] is Iterable
            ? (json[r'repositories'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<ScheduleCreateRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScheduleCreateRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScheduleCreateRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScheduleCreateRequestDto> mapFromJson(dynamic json) {
    final map = <String, ScheduleCreateRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScheduleCreateRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScheduleCreateRequestDto-objects as value to a dart map
  static Map<String, List<ScheduleCreateRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScheduleCreateRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScheduleCreateRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cron',
    'name',
    'repositories',
  };
}

