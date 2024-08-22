//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CropOptionsDto {
  /// Returns a new [CropOptionsDto] instance.
  CropOptionsDto({
    required this.height,
    required this.width,
    required this.x,
    required this.y,
  });

  /// Minimum value: 1
  num height;

  /// Minimum value: 1
  num width;

  /// Minimum value: 1
  num x;

  /// Minimum value: 1
  num y;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CropOptionsDto &&
    other.height == height &&
    other.width == width &&
    other.x == x &&
    other.y == y;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (height.hashCode) +
    (width.hashCode) +
    (x.hashCode) +
    (y.hashCode);

  @override
  String toString() => 'CropOptionsDto[height=$height, width=$width, x=$x, y=$y]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'height'] = this.height;
      json[r'width'] = this.width;
      json[r'x'] = this.x;
      json[r'y'] = this.y;
    return json;
  }

  /// Returns a new [CropOptionsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CropOptionsDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CropOptionsDto(
        height: num.parse('${json[r'height']}'),
        width: num.parse('${json[r'width']}'),
        x: num.parse('${json[r'x']}'),
        y: num.parse('${json[r'y']}'),
      );
    }
    return null;
  }

  static List<CropOptionsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CropOptionsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CropOptionsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CropOptionsDto> mapFromJson(dynamic json) {
    final map = <String, CropOptionsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CropOptionsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CropOptionsDto-objects as value to a dart map
  static Map<String, List<CropOptionsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CropOptionsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CropOptionsDto.listFromJson(entry.value, growable: growable,);
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
  };
}

