//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ImportRecoveryKeyRequest {
  /// Returns a new [ImportRecoveryKeyRequest] instance.
  ImportRecoveryKeyRequest({
    required this.recoveryKey,
  });

  String recoveryKey;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ImportRecoveryKeyRequest &&
    other.recoveryKey == recoveryKey;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (recoveryKey.hashCode);

  @override
  String toString() => 'ImportRecoveryKeyRequest[recoveryKey=$recoveryKey]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'recoveryKey'] = this.recoveryKey;
    return json;
  }

  /// Returns a new [ImportRecoveryKeyRequest] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ImportRecoveryKeyRequest? fromJson(dynamic value) {
    upgradeDto(value, "ImportRecoveryKeyRequest");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ImportRecoveryKeyRequest(
        recoveryKey: mapValueOfType<String>(json, r'recoveryKey')!,
      );
    }
    return null;
  }

  static List<ImportRecoveryKeyRequest> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ImportRecoveryKeyRequest>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ImportRecoveryKeyRequest.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ImportRecoveryKeyRequest> mapFromJson(dynamic json) {
    final map = <String, ImportRecoveryKeyRequest>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ImportRecoveryKeyRequest.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ImportRecoveryKeyRequest-objects as value to a dart map
  static Map<String, List<ImportRecoveryKeyRequest>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ImportRecoveryKeyRequest>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ImportRecoveryKeyRequest.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'recoveryKey',
  };
}

