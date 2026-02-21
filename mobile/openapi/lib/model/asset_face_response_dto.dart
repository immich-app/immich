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

  PersonResponseDto person;

  /// Face detection source type
  AssetFaceResponseDtoSourceTypeEnum? sourceType;

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
    (person.hashCode) +
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
      json[r'person'] = this.person;
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
        person: PersonResponseDto.fromJson(json[r'person'])!,
        sourceType: AssetFaceResponseDtoSourceTypeEnum.fromJson(json[r'sourceType']),
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

/// Face detection source type
class AssetFaceResponseDtoSourceTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetFaceResponseDtoSourceTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const machineLearning = AssetFaceResponseDtoSourceTypeEnum._(r'machine-learning');
  static const exif = AssetFaceResponseDtoSourceTypeEnum._(r'exif');
  static const manual = AssetFaceResponseDtoSourceTypeEnum._(r'manual');

  /// List of all possible values in this [enum][AssetFaceResponseDtoSourceTypeEnum].
  static const values = <AssetFaceResponseDtoSourceTypeEnum>[
    machineLearning,
    exif,
    manual,
  ];

  static AssetFaceResponseDtoSourceTypeEnum? fromJson(dynamic value) => AssetFaceResponseDtoSourceTypeEnumTypeTransformer().decode(value);

  static List<AssetFaceResponseDtoSourceTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceResponseDtoSourceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceResponseDtoSourceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetFaceResponseDtoSourceTypeEnum] to String,
/// and [decode] dynamic data back to [AssetFaceResponseDtoSourceTypeEnum].
class AssetFaceResponseDtoSourceTypeEnumTypeTransformer {
  factory AssetFaceResponseDtoSourceTypeEnumTypeTransformer() => _instance ??= const AssetFaceResponseDtoSourceTypeEnumTypeTransformer._();

  const AssetFaceResponseDtoSourceTypeEnumTypeTransformer._();

  String encode(AssetFaceResponseDtoSourceTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetFaceResponseDtoSourceTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetFaceResponseDtoSourceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'machine-learning': return AssetFaceResponseDtoSourceTypeEnum.machineLearning;
        case r'exif': return AssetFaceResponseDtoSourceTypeEnum.exif;
        case r'manual': return AssetFaceResponseDtoSourceTypeEnum.manual;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetFaceResponseDtoSourceTypeEnumTypeTransformer] instance.
  static AssetFaceResponseDtoSourceTypeEnumTypeTransformer? _instance;
}


