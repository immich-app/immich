//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CurrentRecoveryKeyResponse {
  /// Returns a new [CurrentRecoveryKeyResponse] instance.
  CurrentRecoveryKeyResponse({
    required this.recoveryKey,
  });

  String recoveryKey;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CurrentRecoveryKeyResponse &&
    other.recoveryKey == recoveryKey;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (recoveryKey.hashCode);

  @override
  String toString() => 'CurrentRecoveryKeyResponse[recoveryKey=$recoveryKey]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'recoveryKey'] = this.recoveryKey;
    return json;
  }

  /// Returns a new [CurrentRecoveryKeyResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CurrentRecoveryKeyResponse? fromJson(dynamic value) {
    upgradeDto(value, "CurrentRecoveryKeyResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CurrentRecoveryKeyResponse(
        recoveryKey: mapValueOfType<String>(json, r'recoveryKey')!,
      );
    }
    return null;
  }

  static List<CurrentRecoveryKeyResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CurrentRecoveryKeyResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CurrentRecoveryKeyResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CurrentRecoveryKeyResponse> mapFromJson(dynamic json) {
    final map = <String, CurrentRecoveryKeyResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CurrentRecoveryKeyResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CurrentRecoveryKeyResponse-objects as value to a dart map
  static Map<String, List<CurrentRecoveryKeyResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CurrentRecoveryKeyResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CurrentRecoveryKeyResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'recoveryKey',
  };
}

