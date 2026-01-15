//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MachineLearningCircuitBreakerDto {
  /// Returns a new [MachineLearningCircuitBreakerDto] instance.
  MachineLearningCircuitBreakerDto({
    required this.failureThreshold,
    required this.resetTimeout,
  });

  /// Minimum value: 1
  num failureThreshold;

  /// Minimum value: 1000
  num resetTimeout;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MachineLearningCircuitBreakerDto &&
    other.failureThreshold == failureThreshold &&
    other.resetTimeout == resetTimeout;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (failureThreshold.hashCode) +
    (resetTimeout.hashCode);

  @override
  String toString() => 'MachineLearningCircuitBreakerDto[failureThreshold=$failureThreshold, resetTimeout=$resetTimeout]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'failureThreshold'] = this.failureThreshold;
      json[r'resetTimeout'] = this.resetTimeout;
    return json;
  }

  /// Returns a new [MachineLearningCircuitBreakerDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MachineLearningCircuitBreakerDto? fromJson(dynamic value) {
    upgradeDto(value, "MachineLearningCircuitBreakerDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MachineLearningCircuitBreakerDto(
        failureThreshold: num.parse('${json[r'failureThreshold']}'),
        resetTimeout: num.parse('${json[r'resetTimeout']}'),
      );
    }
    return null;
  }

  static List<MachineLearningCircuitBreakerDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MachineLearningCircuitBreakerDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MachineLearningCircuitBreakerDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MachineLearningCircuitBreakerDto> mapFromJson(dynamic json) {
    final map = <String, MachineLearningCircuitBreakerDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MachineLearningCircuitBreakerDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MachineLearningCircuitBreakerDto-objects as value to a dart map
  static Map<String, List<MachineLearningCircuitBreakerDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MachineLearningCircuitBreakerDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MachineLearningCircuitBreakerDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'failureThreshold',
    'resetTimeout',
  };
}

