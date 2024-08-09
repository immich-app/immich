//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorActionCrop {
  /// Returns a new [EditorActionCrop] instance.
  EditorActionCrop({
    required this.action,
    required this.region,
  });

  EditorActionType action;

  EditorCropRegion region;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorActionCrop &&
    other.action == action &&
    other.region == region;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (region.hashCode);

  @override
  String toString() => 'EditorActionCrop[action=$action, region=$region]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'region'] = this.region;
    return json;
  }

  /// Returns a new [EditorActionCrop] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorActionCrop? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorActionCrop(
        action: EditorActionType.fromJson(json[r'action'])!,
        region: EditorCropRegion.fromJson(json[r'region'])!,
      );
    }
    return null;
  }

  static List<EditorActionCrop> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorActionCrop>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorActionCrop.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorActionCrop> mapFromJson(dynamic json) {
    final map = <String, EditorActionCrop>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorActionCrop.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorActionCrop-objects as value to a dart map
  static Map<String, List<EditorActionCrop>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorActionCrop>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorActionCrop.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'region',
  };
}

