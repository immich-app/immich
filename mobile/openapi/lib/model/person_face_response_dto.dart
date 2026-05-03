//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonFaceResponseDto {
  /// Returns a new [PersonFaceResponseDto] instance.
  PersonFaceResponseDto({
    required this.assetId,
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    this.fileCreatedAt,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.isRepresentative,
    this.sourceType,
  });

  /// Asset ID containing the face
  String assetId;

  /// Bounding box X1 coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int boundingBoxX1;

  /// Bounding box X2 coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int boundingBoxX2;

  /// Bounding box Y1 coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int boundingBoxY1;

  /// Bounding box Y2 coordinate
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int boundingBoxY2;

  /// Asset creation date
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? fileCreatedAt;

  /// Face ID
  String id;

  /// Image height in pixels
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int imageHeight;

  /// Image width in pixels
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int imageWidth;

  /// Whether this face is the current representative face
  bool isRepresentative;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SourceType? sourceType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonFaceResponseDto &&
    other.assetId == assetId &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.fileCreatedAt == fileCreatedAt &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.isRepresentative == isRepresentative &&
    other.sourceType == sourceType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (boundingBoxX1.hashCode) +
    (boundingBoxX2.hashCode) +
    (boundingBoxY1.hashCode) +
    (boundingBoxY2.hashCode) +
    (fileCreatedAt == null ? 0 : fileCreatedAt!.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (isRepresentative.hashCode) +
    (sourceType == null ? 0 : sourceType!.hashCode);

  @override
  String toString() => 'PersonFaceResponseDto[assetId=$assetId, boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, fileCreatedAt=$fileCreatedAt, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, isRepresentative=$isRepresentative, sourceType=$sourceType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
    if (this.fileCreatedAt != null) {
      json[r'fileCreatedAt'] = this.fileCreatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'fileCreatedAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
      json[r'isRepresentative'] = this.isRepresentative;
    if (this.sourceType != null) {
      json[r'sourceType'] = this.sourceType;
    } else {
    //  json[r'sourceType'] = null;
    }
    return json;
  }

  /// Returns a new [PersonFaceResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonFaceResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonFaceResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonFaceResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r''),
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        isRepresentative: mapValueOfType<bool>(json, r'isRepresentative')!,
        sourceType: SourceType.fromJson(json[r'sourceType']),
      );
    }
    return null;
  }

  static List<PersonFaceResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonFaceResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonFaceResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonFaceResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonFaceResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonFaceResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonFaceResponseDto-objects as value to a dart map
  static Map<String, List<PersonFaceResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonFaceResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonFaceResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'boundingBoxX1',
    'boundingBoxX2',
    'boundingBoxY1',
    'boundingBoxY2',
    'id',
    'imageHeight',
    'imageWidth',
    'isRepresentative',
  };
}

