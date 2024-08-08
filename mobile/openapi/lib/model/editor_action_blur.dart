//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorActionBlur {
  /// Returns a new [EditorActionBlur] instance.
  EditorActionBlur({
    required this.action,
  });

  EditorActionType action;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorActionBlur &&
    other.action == action;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode);

  @override
  String toString() => 'EditorActionBlur[action=$action]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
    return json;
  }

  /// Returns a new [EditorActionBlur] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorActionBlur? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorActionBlur(
        action: EditorActionType.fromJson(json[r'action'])!,
      );
    }
    return null;
  }

  static List<EditorActionBlur> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorActionBlur>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorActionBlur.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorActionBlur> mapFromJson(dynamic json) {
    final map = <String, EditorActionBlur>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorActionBlur.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorActionBlur-objects as value to a dart map
  static Map<String, List<EditorActionBlur>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorActionBlur>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorActionBlur.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
  };
}

