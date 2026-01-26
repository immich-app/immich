//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionFilter {
  /// Returns a new [AssetEditActionFilter] instance.
  AssetEditActionFilter({
    required this.action,
    required this.parameters,
  });

  AssetEditAction action;

  FilterParameters parameters;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionFilter &&
    other.action == action &&
    other.parameters == parameters;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (parameters.hashCode);

  @override
  String toString() => 'AssetEditActionFilter[action=$action, parameters=$parameters]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'parameters'] = this.parameters;
    return json;
  }

  /// Returns a new [AssetEditActionFilter] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionFilter? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionFilter");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionFilter(
        action: AssetEditAction.fromJson(json[r'action'])!,
        parameters: FilterParameters.fromJson(json[r'parameters'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionFilter> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionFilter>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionFilter.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionFilter> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionFilter>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionFilter.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionFilter-objects as value to a dart map
  static Map<String, List<AssetEditActionFilter>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionFilter>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionFilter.listFromJson(entry.value, growable: growable,);
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

