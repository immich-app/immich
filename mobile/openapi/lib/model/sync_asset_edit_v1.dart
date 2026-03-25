//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetEditV1 {
  /// Returns a new [SyncAssetEditV1] instance.
  SyncAssetEditV1({
    required this.action,
    required this.assetId,
    required this.id,
    required this.parameters,
    required this.sequence,
  });

  AssetEditAction action;

  String assetId;

  String id;

  Object parameters;

  int sequence;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetEditV1 &&
    other.action == action &&
    other.assetId == assetId &&
    other.id == id &&
    other.parameters == parameters &&
    other.sequence == sequence;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (assetId.hashCode) +
    (id.hashCode) +
    (parameters.hashCode) +
    (sequence.hashCode);

  @override
  String toString() => 'SyncAssetEditV1[action=$action, assetId=$assetId, id=$id, parameters=$parameters, sequence=$sequence]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'assetId'] = this.assetId;
      json[r'id'] = this.id;
      json[r'parameters'] = this.parameters;
      json[r'sequence'] = this.sequence;
    return json;
  }

  /// Returns a new [SyncAssetEditV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetEditV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetEditV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetEditV1(
        action: AssetEditAction.fromJson(json[r'action'])!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        id: mapValueOfType<String>(json, r'id')!,
        parameters: mapValueOfType<Object>(json, r'parameters')!,
        sequence: mapValueOfType<int>(json, r'sequence')!,
      );
    }
    return null;
  }

  static List<SyncAssetEditV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetEditV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetEditV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetEditV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetEditV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetEditV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetEditV1-objects as value to a dart map
  static Map<String, List<SyncAssetEditV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetEditV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetEditV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'assetId',
    'id',
    'parameters',
    'sequence',
  };
}

