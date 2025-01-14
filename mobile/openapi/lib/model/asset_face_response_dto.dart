//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceResponseDto {
  /// Returns a new [AssetFaceResponseDto] instance.
  AssetFaceResponseDto({
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.person,
    this.sourceType,
  });

  int boundingBoxX1;

  int boundingBoxX2;

  int boundingBoxY1;

  int boundingBoxY2;

  String id;

  int imageHeight;

  int imageWidth;

  PersonResponseDto? person;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SourceType? sourceType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceResponseDto &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.person == person &&
    other.sourceType == sourceType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (boundingBoxX1.hashCode) +
    (boundingBoxX2.hashCode) +
    (boundingBoxY1.hashCode) +
    (boundingBoxY2.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (person == null ? 0 : person!.hashCode) +
    (sourceType == null ? 0 : sourceType!.hashCode);

  @override
  String toString() => 'AssetFaceResponseDto[boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, person=$person, sourceType=$sourceType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
    if (this.person != null) {
      json[r'person'] = this.person;
    } else {
    //  json[r'person'] = null;
    }
    if (this.sourceType != null) {
      json[r'sourceType'] = this.sourceType;
    } else {
    //  json[r'sourceType'] = null;
    }
    return json;
  }

  /// Returns a new [AssetFaceResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFaceResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceResponseDto(
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        person: PersonResponseDto.fromJson(json[r'person']),
        sourceType: SourceType.fromJson(json[r'sourceType']),
      );
    }
    return null;
  }

  static List<AssetFaceResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetFaceResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceResponseDto-objects as value to a dart map
  static Map<String, List<AssetFaceResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceResponseDto.listFromJson(entry.value, growable: growable,);
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
    'id',
    'imageHeight',
    'imageWidth',
    'person',
  };
}

