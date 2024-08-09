//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EditorCreateAssetDtoEditsInner {
  /// Returns a new [EditorCreateAssetDtoEditsInner] instance.
  EditorCreateAssetDtoEditsInner({
    required this.action,
    required this.region,
    required this.angle,
    required this.brightness,
    required this.hue,
    required this.lightness,
    required this.saturation,
  });

  EditorActionType action;

  EditorCropRegion region;

  int angle;

  int brightness;

  int hue;

  int lightness;

  int saturation;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EditorCreateAssetDtoEditsInner &&
    other.action == action &&
    other.region == region &&
    other.angle == angle &&
    other.brightness == brightness &&
    other.hue == hue &&
    other.lightness == lightness &&
    other.saturation == saturation;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (region.hashCode) +
    (angle.hashCode) +
    (brightness.hashCode) +
    (hue.hashCode) +
    (lightness.hashCode) +
    (saturation.hashCode);

  @override
  String toString() => 'EditorCreateAssetDtoEditsInner[action=$action, region=$region, angle=$angle, brightness=$brightness, hue=$hue, lightness=$lightness, saturation=$saturation]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'region'] = this.region;
      json[r'angle'] = this.angle;
      json[r'brightness'] = this.brightness;
      json[r'hue'] = this.hue;
      json[r'lightness'] = this.lightness;
      json[r'saturation'] = this.saturation;
    return json;
  }

  /// Returns a new [EditorCreateAssetDtoEditsInner] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EditorCreateAssetDtoEditsInner? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EditorCreateAssetDtoEditsInner(
        action: EditorActionType.fromJson(json[r'action'])!,
        region: EditorCropRegion.fromJson(json[r'region'])!,
        angle: mapValueOfType<int>(json, r'angle')!,
        brightness: mapValueOfType<int>(json, r'brightness')!,
        hue: mapValueOfType<int>(json, r'hue')!,
        lightness: mapValueOfType<int>(json, r'lightness')!,
        saturation: mapValueOfType<int>(json, r'saturation')!,
      );
    }
    return null;
  }

  static List<EditorCreateAssetDtoEditsInner> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditorCreateAssetDtoEditsInner>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditorCreateAssetDtoEditsInner.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EditorCreateAssetDtoEditsInner> mapFromJson(dynamic json) {
    final map = <String, EditorCreateAssetDtoEditsInner>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EditorCreateAssetDtoEditsInner.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EditorCreateAssetDtoEditsInner-objects as value to a dart map
  static Map<String, List<EditorCreateAssetDtoEditsInner>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EditorCreateAssetDtoEditsInner>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EditorCreateAssetDtoEditsInner.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'region',
    'angle',
    'brightness',
    'hue',
    'lightness',
    'saturation',
  };
}

