//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigTemplateStorageOptionDto {
  /// Returns a new [SystemConfigTemplateStorageOptionDto] instance.
  SystemConfigTemplateStorageOptionDto({
    this.yearOptions = const [],
    this.monthOptions = const [],
    this.dayOptions = const [],
    this.hourOptions = const [],
    this.minuteOptions = const [],
    this.secondOptions = const [],
    this.presetOptions = const [],
  });

  List<String> yearOptions;

  List<String> monthOptions;

  List<String> dayOptions;

  List<String> hourOptions;

  List<String> minuteOptions;

  List<String> secondOptions;

  List<String> presetOptions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigTemplateStorageOptionDto &&
     other.yearOptions == yearOptions &&
     other.monthOptions == monthOptions &&
     other.dayOptions == dayOptions &&
     other.hourOptions == hourOptions &&
     other.minuteOptions == minuteOptions &&
     other.secondOptions == secondOptions &&
     other.presetOptions == presetOptions;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (yearOptions.hashCode) +
    (monthOptions.hashCode) +
    (dayOptions.hashCode) +
    (hourOptions.hashCode) +
    (minuteOptions.hashCode) +
    (secondOptions.hashCode) +
    (presetOptions.hashCode);

  @override
  String toString() => 'SystemConfigTemplateStorageOptionDto[yearOptions=$yearOptions, monthOptions=$monthOptions, dayOptions=$dayOptions, hourOptions=$hourOptions, minuteOptions=$minuteOptions, secondOptions=$secondOptions, presetOptions=$presetOptions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'yearOptions'] = this.yearOptions;
      json[r'monthOptions'] = this.monthOptions;
      json[r'dayOptions'] = this.dayOptions;
      json[r'hourOptions'] = this.hourOptions;
      json[r'minuteOptions'] = this.minuteOptions;
      json[r'secondOptions'] = this.secondOptions;
      json[r'presetOptions'] = this.presetOptions;
    return json;
  }

  /// Returns a new [SystemConfigTemplateStorageOptionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigTemplateStorageOptionDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigTemplateStorageOptionDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigTemplateStorageOptionDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigTemplateStorageOptionDto(
        yearOptions: json[r'yearOptions'] is List
            ? (json[r'yearOptions'] as List).cast<String>()
            : const [],
        monthOptions: json[r'monthOptions'] is List
            ? (json[r'monthOptions'] as List).cast<String>()
            : const [],
        dayOptions: json[r'dayOptions'] is List
            ? (json[r'dayOptions'] as List).cast<String>()
            : const [],
        hourOptions: json[r'hourOptions'] is List
            ? (json[r'hourOptions'] as List).cast<String>()
            : const [],
        minuteOptions: json[r'minuteOptions'] is List
            ? (json[r'minuteOptions'] as List).cast<String>()
            : const [],
        secondOptions: json[r'secondOptions'] is List
            ? (json[r'secondOptions'] as List).cast<String>()
            : const [],
        presetOptions: json[r'presetOptions'] is List
            ? (json[r'presetOptions'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<SystemConfigTemplateStorageOptionDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigTemplateStorageOptionDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'yearOptions',
    'monthOptions',
    'dayOptions',
    'hourOptions',
    'minuteOptions',
    'secondOptions',
    'presetOptions',
  };
}

