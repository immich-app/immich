//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MachineLearningStreamModeDto {
  /// Returns a new [MachineLearningStreamModeDto] instance.
  MachineLearningStreamModeDto({
    required this.enabled,
    required this.maxPending,
    required this.maxRetries,
    required this.resultTtlHours,
  });

  bool enabled;

  /// Minimum value: 1
  num maxPending;

  /// Minimum value: 1
  num maxRetries;

  /// Minimum value: 1
  num resultTtlHours;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MachineLearningStreamModeDto &&
    other.enabled == enabled &&
    other.maxPending == maxPending &&
    other.maxRetries == maxRetries &&
    other.resultTtlHours == resultTtlHours;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (maxPending.hashCode) +
    (maxRetries.hashCode) +
    (resultTtlHours.hashCode);

  @override
  String toString() => 'MachineLearningStreamModeDto[enabled=$enabled, maxPending=$maxPending, maxRetries=$maxRetries, resultTtlHours=$resultTtlHours]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'maxPending'] = this.maxPending;
      json[r'maxRetries'] = this.maxRetries;
      json[r'resultTtlHours'] = this.resultTtlHours;
    return json;
  }

  /// Returns a new [MachineLearningStreamModeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MachineLearningStreamModeDto? fromJson(dynamic value) {
    upgradeDto(value, "MachineLearningStreamModeDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MachineLearningStreamModeDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        maxPending: num.parse('${json[r'maxPending']}'),
        maxRetries: num.parse('${json[r'maxRetries']}'),
        resultTtlHours: num.parse('${json[r'resultTtlHours']}'),
      );
    }
    return null;
  }

  static List<MachineLearningStreamModeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MachineLearningStreamModeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MachineLearningStreamModeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MachineLearningStreamModeDto> mapFromJson(dynamic json) {
    final map = <String, MachineLearningStreamModeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MachineLearningStreamModeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MachineLearningStreamModeDto-objects as value to a dart map
  static Map<String, List<MachineLearningStreamModeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MachineLearningStreamModeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MachineLearningStreamModeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'maxPending',
    'maxRetries',
    'resultTtlHours',
  };
}

