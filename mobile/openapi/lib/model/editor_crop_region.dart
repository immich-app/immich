//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorCropRegion {
  /// Returns a new [EditorCropRegion] instance.
  EditorCropRegion({
    required this.height,
    required this.left,
    required this.top,
    required this.width,
  });

  int height;

  int left;

  int top;

  int width;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorCropRegion &&
    other.height == height &&
    other.left == left &&
    other.top == top &&
    other.width == width;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (height.hashCode) +
    (left.hashCode) +
    (top.hashCode) +
    (width.hashCode);

  @override
  String toString() => 'EditorCropRegion[height=$height, left=$left, top=$top, width=$width]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'height'] = this.height;
      json[r'left'] = this.left;
      json[r'top'] = this.top;
      json[r'width'] = this.width;
    return json;
  }

  /// Returns a new [EditorCropRegion] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorCropRegion? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorCropRegion(
        height: mapValueOfType<int>(json, r'height')!,
        left: mapValueOfType<int>(json, r'left')!,
        top: mapValueOfType<int>(json, r'top')!,
        width: mapValueOfType<int>(json, r'width')!,
      );
    }
    return null;
  }

  static List<EditorCropRegion> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorCropRegion>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorCropRegion.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorCropRegion> mapFromJson(dynamic json) {
    final map = <String, EditorCropRegion>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorCropRegion.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorCropRegion-objects as value to a dart map
  static Map<String, List<EditorCropRegion>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorCropRegion>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorCropRegion.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'height',
    'left',
    'top',
    'width',
  };
}

