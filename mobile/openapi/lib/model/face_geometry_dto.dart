//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FaceGeometryDto {
  /// Returns a new [FaceGeometryDto] instance.
  FaceGeometryDto({
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.imageHeight,
    required this.imageWidth,
  });

  int boundingBoxX1;

  int boundingBoxX2;

  int boundingBoxY1;

  int boundingBoxY2;

  int imageHeight;

  int imageWidth;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FaceGeometryDto &&
     other.boundingBoxX1 == boundingBoxX1 &&
     other.boundingBoxX2 == boundingBoxX2 &&
     other.boundingBoxY1 == boundingBoxY1 &&
     other.boundingBoxY2 == boundingBoxY2 &&
     other.imageHeight == imageHeight &&
     other.imageWidth == imageWidth;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (boundingBoxX1.hashCode) +
    (boundingBoxX2.hashCode) +
    (boundingBoxY1.hashCode) +
    (boundingBoxY2.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode);

  @override
  String toString() => 'FaceGeometryDto[boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, imageHeight=$imageHeight, imageWidth=$imageWidth]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
    return json;
  }

  /// Returns a new [FaceGeometryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FaceGeometryDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return FaceGeometryDto(
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
      );
    }
    return null;
  }

  static List<FaceGeometryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FaceGeometryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FaceGeometryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FaceGeometryDto> mapFromJson(dynamic json) {
    final map = <String, FaceGeometryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FaceGeometryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FaceGeometryDto-objects as value to a dart map
  static Map<String, List<FaceGeometryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FaceGeometryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FaceGeometryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'boundingBoxX1',
    'boundingBoxX2',
    'boundingBoxY1',
    'boundingBoxY2',
    'imageHeight',
    'imageWidth',
  };
}

