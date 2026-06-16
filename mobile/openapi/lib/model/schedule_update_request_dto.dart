//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ScheduleUpdateRequestDto {
  /// Returns a new [ScheduleUpdateRequestDto] instance.
  ScheduleUpdateRequestDto({
    this.cron = const Optional.absent(),
    this.name = const Optional.absent(),
    this.paused = const Optional.absent(),
    this.repositories = const Optional.present(const []),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> cron;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> paused;

  Optional<List<String>?> repositories;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ScheduleUpdateRequestDto &&
    other.cron == cron &&
    other.name == name &&
    other.paused == paused &&
    _deepEquality.equals(other.repositories, repositories);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cron == null ? 0 : cron!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (paused == null ? 0 : paused!.hashCode) +
    (repositories.hashCode);

  @override
  String toString() => 'ScheduleUpdateRequestDto[cron=$cron, name=$name, paused=$paused, repositories=$repositories]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.cron.isPresent) {
      final value = this.cron.value;
      json[r'cron'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    if (this.paused.isPresent) {
      final value = this.paused.value;
      json[r'paused'] = value;
    }
    if (this.repositories.isPresent) {
      final value = this.repositories.value;
      json[r'repositories'] = value;
    }
    return json;
  }

  /// Returns a new [ScheduleUpdateRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ScheduleUpdateRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "ScheduleUpdateRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ScheduleUpdateRequestDto(
        cron: json.containsKey(r'cron') ? Optional.present(mapValueOfType<String>(json, r'cron')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        paused: json.containsKey(r'paused') ? Optional.present(mapValueOfType<bool>(json, r'paused')) : const Optional.absent(),
        repositories: json.containsKey(r'repositories') ? Optional.present(json[r'repositories'] is Iterable
            ? (json[r'repositories'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<ScheduleUpdateRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ScheduleUpdateRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ScheduleUpdateRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ScheduleUpdateRequestDto> mapFromJson(dynamic json) {
    final map = <String, ScheduleUpdateRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ScheduleUpdateRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ScheduleUpdateRequestDto-objects as value to a dart map
  static Map<String, List<ScheduleUpdateRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ScheduleUpdateRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ScheduleUpdateRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

