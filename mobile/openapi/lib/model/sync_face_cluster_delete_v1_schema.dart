//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncFaceClusterDeleteV1Schema {
  /// Returns a new [SyncFaceClusterDeleteV1Schema] instance.
  SyncFaceClusterDeleteV1Schema({
    required this.faceClusterId,
  });

  /// Face cluster ID
  String faceClusterId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncFaceClusterDeleteV1Schema &&
    other.faceClusterId == faceClusterId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (faceClusterId.hashCode);

  @override
  String toString() => 'SyncFaceClusterDeleteV1Schema[faceClusterId=$faceClusterId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'faceClusterId'] = this.faceClusterId;
    return json;
  }

  /// Returns a new [SyncFaceClusterDeleteV1Schema] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncFaceClusterDeleteV1Schema? fromJson(dynamic value) {
    upgradeDto(value, "SyncFaceClusterDeleteV1Schema");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncFaceClusterDeleteV1Schema(
        faceClusterId: mapValueOfType<String>(json, r'faceClusterId')!,
      );
    }
    return null;
  }

  static List<SyncFaceClusterDeleteV1Schema> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncFaceClusterDeleteV1Schema>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncFaceClusterDeleteV1Schema.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncFaceClusterDeleteV1Schema> mapFromJson(dynamic json) {
    final map = <String, SyncFaceClusterDeleteV1Schema>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncFaceClusterDeleteV1Schema.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncFaceClusterDeleteV1Schema-objects as value to a dart map
  static Map<String, List<SyncFaceClusterDeleteV1Schema>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncFaceClusterDeleteV1Schema>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncFaceClusterDeleteV1Schema.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'faceClusterId',
  };
}

