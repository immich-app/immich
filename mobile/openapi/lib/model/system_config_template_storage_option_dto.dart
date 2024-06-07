//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigTemplateStorageOptionDto {
  /// Returns a new [SystemConfigTemplateStorageOptionDto] instance.
  SystemConfigTemplateStorageOptionDto({
    this.dayOptions = const [],
    this.hourOptions = const [],
    this.minuteOptions = const [],
    this.monthOptions = const [],
    this.presetOptions = const [],
    this.secondOptions = const [],
    this.weekOptions = const [],
    this.yearOptions = const [],
  });

  List<String> dayOptions;

  List<String> hourOptions;

  List<String> minuteOptions;

  List<String> monthOptions;

  List<String> presetOptions;

  List<String> secondOptions;

  List<String> weekOptions;

  List<String> yearOptions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigTemplateStorageOptionDto &&
    _deepEquality.equals(other.dayOptions, dayOptions) &&
    _deepEquality.equals(other.hourOptions, hourOptions) &&
    _deepEquality.equals(other.minuteOptions, minuteOptions) &&
    _deepEquality.equals(other.monthOptions, monthOptions) &&
    _deepEquality.equals(other.presetOptions, presetOptions) &&
    _deepEquality.equals(other.secondOptions, secondOptions) &&
    _deepEquality.equals(other.weekOptions, weekOptions) &&
    _deepEquality.equals(other.yearOptions, yearOptions);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dayOptions.hashCode) +
    (hourOptions.hashCode) +
    (minuteOptions.hashCode) +
    (monthOptions.hashCode) +
    (presetOptions.hashCode) +
    (secondOptions.hashCode) +
    (weekOptions.hashCode) +
    (yearOptions.hashCode);

  @override
  String toString() => 'SystemConfigTemplateStorageOptionDto[dayOptions=$dayOptions, hourOptions=$hourOptions, minuteOptions=$minuteOptions, monthOptions=$monthOptions, presetOptions=$presetOptions, secondOptions=$secondOptions, weekOptions=$weekOptions, yearOptions=$yearOptions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'dayOptions'] = this.dayOptions;
      json[r'hourOptions'] = this.hourOptions;
      json[r'minuteOptions'] = this.minuteOptions;
      json[r'monthOptions'] = this.monthOptions;
      json[r'presetOptions'] = this.presetOptions;
      json[r'secondOptions'] = this.secondOptions;
      json[r'weekOptions'] = this.weekOptions;
      json[r'yearOptions'] = this.yearOptions;
    return json;
  }

  /// Returns a new [SystemConfigTemplateStorageOptionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigTemplateStorageOptionDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigTemplateStorageOptionDto(
        dayOptions: json[r'dayOptions'] is Iterable
            ? (json[r'dayOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        hourOptions: json[r'hourOptions'] is Iterable
            ? (json[r'hourOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        minuteOptions: json[r'minuteOptions'] is Iterable
            ? (json[r'minuteOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        monthOptions: json[r'monthOptions'] is Iterable
            ? (json[r'monthOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        presetOptions: json[r'presetOptions'] is Iterable
            ? (json[r'presetOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        secondOptions: json[r'secondOptions'] is Iterable
            ? (json[r'secondOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        weekOptions: json[r'weekOptions'] is Iterable
            ? (json[r'weekOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        yearOptions: json[r'yearOptions'] is Iterable
            ? (json[r'yearOptions'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SystemConfigTemplateStorageOptionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigTemplateStorageOptionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigTemplateStorageOptionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigTemplateStorageOptionDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigTemplateStorageOptionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigTemplateStorageOptionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigTemplateStorageOptionDto-objects as value to a dart map
  static Map<String, List<SystemConfigTemplateStorageOptionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigTemplateStorageOptionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigTemplateStorageOptionDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'dayOptions',
    'hourOptions',
    'minuteOptions',
    'monthOptions',
    'presetOptions',
    'secondOptions',
    'weekOptions',
    'yearOptions',
  };
}

