//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditsDtoEditsInner {
  /// Returns a new [AssetEditsDtoEditsInner] instance.
  AssetEditsDtoEditsInner({
    required this.action,
    required this.index,
    required this.parameters,
  });

  EditActionType action;

  /// Order of this edit in the sequence
  ///
  /// Minimum value: 0
  num index;

  MirrorParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditsDtoEditsInner &&
    other.action == action &&
    other.index == index &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (index.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditsDtoEditsInner[action=$action, index=$index, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'index'] = this.index;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditsDtoEditsInner] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditsDtoEditsInner? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditsDtoEditsInner");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditsDtoEditsInner(
        action: EditActionType.fromJson(json[r'action'])!,
        index: num.parse('${json[r'index']}'),
        parameters: MirrorParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditsDtoEditsInner> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditsDtoEditsInner>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditsDtoEditsInner.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditsDtoEditsInner> mapFromJson(dynamic json) {
    final map = <String, AssetEditsDtoEditsInner>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditsDtoEditsInner.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditsDtoEditsInner-objects as value to a dart map
  static Map<String, List<AssetEditsDtoEditsInner>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditsDtoEditsInner>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditsDtoEditsInner.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'index',
    'parameters',
  };
}

