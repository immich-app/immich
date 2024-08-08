//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorActionRotate {
  /// Returns a new [EditorActionRotate] instance.
  EditorActionRotate({
    required this.action,
    required this.angle,
  });

  EditorActionType action;

  int angle;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorActionRotate &&
    other.action == action &&
    other.angle == angle;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (angle.hashCode);

  @override
  String toString() => 'EditorActionRotate[action=$action, angle=$angle]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'angle'] = this.angle;
    return json;
  }

  /// Returns a new [EditorActionRotate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorActionRotate? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorActionRotate(
        action: EditorActionType.fromJson(json[r'action'])!,
        angle: mapValueOfType<int>(json, r'angle')!,
      );
    }
    return null;
  }

  static List<EditorActionRotate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorActionRotate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorActionRotate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorActionRotate> mapFromJson(dynamic json) {
    final map = <String, EditorActionRotate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorActionRotate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorActionRotate-objects as value to a dart map
  static Map<String, List<EditorActionRotate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorActionRotate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorActionRotate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'angle',
  };
}

