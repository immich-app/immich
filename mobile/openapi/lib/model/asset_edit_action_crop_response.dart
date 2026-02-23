//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionCropResponse {
  /// Returns a new [AssetEditActionCropResponse] instance.
  AssetEditActionCropResponse({
    required this.action,
    required this.id,
    required this.parameters,
  });

  /// Type of edit action to perform
  AssetEditAction action;

  /// Unique ID of this edit action
  String id;

  CropParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionCropResponse &&
    other.action == action &&
    other.id == id &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (id.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditActionCropResponse[action=$action, id=$id, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'id'] = this.id;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditActionCropResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionCropResponse? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionCropResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionCropResponse(
        action: AssetEditAction.fromJson(json[r'action'])!,
        id: mapValueOfType<String>(json, r'id')!,
        parameters: CropParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionCropResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionCropResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionCropResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionCropResponse> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionCropResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionCropResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionCropResponse-objects as value to a dart map
  static Map<String, List<AssetEditActionCropResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionCropResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionCropResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'id',
    'parameters',
  };
}

