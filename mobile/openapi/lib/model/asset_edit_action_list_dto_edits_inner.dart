//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionListDtoEditsInner {
  /// Returns a new [AssetEditActionListDtoEditsInner] instance.
  AssetEditActionListDtoEditsInner({
    required this.action,
    required this.parameters,
  });

  AssetEditAction action;

  MirrorParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionListDtoEditsInner &&
    other.action == action &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditActionListDtoEditsInner[action=$action, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditActionListDtoEditsInner] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionListDtoEditsInner? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionListDtoEditsInner");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionListDtoEditsInner(
        action: AssetEditAction.fromJson(json[r'action'])!,
        parameters: MirrorParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionListDtoEditsInner> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionListDtoEditsInner>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionListDtoEditsInner.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionListDtoEditsInner> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionListDtoEditsInner>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionListDtoEditsInner.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionListDtoEditsInner-objects as value to a dart map
  static Map<String, List<AssetEditActionListDtoEditsInner>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionListDtoEditsInner>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionListDtoEditsInner.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'parameters',
  };
}

