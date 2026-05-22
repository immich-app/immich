//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEditActionItemDtoParameters {
  /// Returns a new [AssetEditActionItemDtoParameters] instance.
  AssetEditActionItemDtoParameters({
    required this.height,
    required this.width,
    required this.x,
    required this.y,
    required this.angle,
    required this.axis,
  });

  /// Height of the crop
  ///
  /// Minimum value: 1
  num height;

  /// Width of the crop
  ///
  /// Minimum value: 1
  num width;

  /// Top-Left X coordinate of crop
  ///
  /// Minimum value: 0
  num x;

  /// Top-Left Y coordinate of crop
  ///
  /// Minimum value: 0
  num y;

  /// Rotation angle in degrees
  num angle;

  /// Axis to mirror along
  MirrorAxis axis;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEditActionItemDtoParameters &&
    other.height == height &&
    other.width == width &&
    other.x == x &&
    other.y == y &&
    other.angle == angle &&
    other.axis == axis;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (height.hashCode) +
    (width.hashCode) +
    (x.hashCode) +
    (y.hashCode) +
    (angle.hashCode) +
    (axis.hashCode);

  @override
  String toString() => 'AssetEditActionItemDtoParameters[height=$height, width=$width, x=$x, y=$y, angle=$angle, axis=$axis]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'height'] = this.height;
      json[r'width'] = this.width;
      json[r'x'] = this.x;
      json[r'y'] = this.y;
      json[r'angle'] = this.angle;
      json[r'axis'] = this.axis;
    return json;
  }

  /// Returns a new [AssetEditActionItemDtoParameters] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEditActionItemDtoParameters? fromJson(dynamic value) {
    upgradeDto(value, "AssetEditActionItemDtoParameters");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEditActionItemDtoParameters(
        height: num.parse('${json[r'height']}'),
        width: num.parse('${json[r'width']}'),
        x: num.parse('${json[r'x']}'),
        y: num.parse('${json[r'y']}'),
        angle: num.parse('${json[r'angle']}'),
        axis: MirrorAxis.fromJson(json[r'axis'])!,
      );
    }
    return null;
  }

  static List<AssetEditActionItemDtoParameters> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEditActionItemDtoParameters>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEditActionItemDtoParameters.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEditActionItemDtoParameters> mapFromJson(dynamic json) {
    final map = <String, AssetEditActionItemDtoParameters>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEditActionItemDtoParameters.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEditActionItemDtoParameters-objects as value to a dart map
  static Map<String, List<AssetEditActionItemDtoParameters>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEditActionItemDtoParameters>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEditActionItemDtoParameters.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'height',
    'width',
    'x',
    'y',
    'angle',
    'axis',
  };
}

