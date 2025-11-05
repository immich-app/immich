//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MachineLearningAvailabilityChecksDto {
  /// Returns a new [MachineLearningAvailabilityChecksDto] instance.
  MachineLearningAvailabilityChecksDto({
    required this.enabled,
    required this.interval,
    required this.timeout,
  });

  bool enabled;

  num interval;

  num timeout;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MachineLearningAvailabilityChecksDto &&
    other.enabled == enabled &&
    other.interval == interval &&
    other.timeout == timeout;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (interval.hashCode) +
    (timeout.hashCode);

  @override
  String toString() => 'MachineLearningAvailabilityChecksDto[enabled=$enabled, interval=$interval, timeout=$timeout]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'interval'] = this.interval;
      json[r'timeout'] = this.timeout;
    return json;
  }

  /// Returns a new [MachineLearningAvailabilityChecksDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MachineLearningAvailabilityChecksDto? fromJson(dynamic value) {
    upgradeDto(value, "MachineLearningAvailabilityChecksDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MachineLearningAvailabilityChecksDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        interval: num.parse('${json[r'interval']}'),
        timeout: num.parse('${json[r'timeout']}'),
      );
    }
    return null;
  }

  static List<MachineLearningAvailabilityChecksDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MachineLearningAvailabilityChecksDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MachineLearningAvailabilityChecksDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MachineLearningAvailabilityChecksDto> mapFromJson(dynamic json) {
    final map = <String, MachineLearningAvailabilityChecksDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MachineLearningAvailabilityChecksDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MachineLearningAvailabilityChecksDto-objects as value to a dart map
  static Map<String, List<MachineLearningAvailabilityChecksDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MachineLearningAvailabilityChecksDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MachineLearningAvailabilityChecksDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'interval',
    'timeout',
  };
}

