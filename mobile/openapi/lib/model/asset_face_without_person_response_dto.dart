//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceWithoutPersonResponseDto {
  /// Returns a new [AssetFaceWithoutPersonResponseDto] instance.
  AssetFaceWithoutPersonResponseDto({
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
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

  /// Face detection source type
  AssetFaceWithoutPersonResponseDtoSourceTypeEnum? sourceType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceWithoutPersonResponseDto &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
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
    (sourceType == null ? 0 : sourceType!.hashCode);

  @override
  String toString() => 'AssetFaceWithoutPersonResponseDto[boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, sourceType=$sourceType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
    if (this.sourceType != null) {
      json[r'sourceType'] = this.sourceType;
    } else {
    //  json[r'sourceType'] = null;
    }
    return json;
  }

  /// Returns a new [AssetFaceWithoutPersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceWithoutPersonResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFaceWithoutPersonResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceWithoutPersonResponseDto(
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        sourceType: AssetFaceWithoutPersonResponseDtoSourceTypeEnum.fromJson(json[r'sourceType']),
      );
    }
    return null;
  }

  static List<AssetFaceWithoutPersonResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceWithoutPersonResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceWithoutPersonResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceWithoutPersonResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetFaceWithoutPersonResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceWithoutPersonResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceWithoutPersonResponseDto-objects as value to a dart map
  static Map<String, List<AssetFaceWithoutPersonResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceWithoutPersonResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceWithoutPersonResponseDto.listFromJson(entry.value, growable: growable,);
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
  };
}

/// Face detection source type
class AssetFaceWithoutPersonResponseDtoSourceTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetFaceWithoutPersonResponseDtoSourceTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const machineLearning = AssetFaceWithoutPersonResponseDtoSourceTypeEnum._(r'machine-learning');
  static const exif = AssetFaceWithoutPersonResponseDtoSourceTypeEnum._(r'exif');
  static const manual = AssetFaceWithoutPersonResponseDtoSourceTypeEnum._(r'manual');

  /// List of all possible values in this [enum][AssetFaceWithoutPersonResponseDtoSourceTypeEnum].
  static const values = <AssetFaceWithoutPersonResponseDtoSourceTypeEnum>[
    machineLearning,
    exif,
    manual,
  ];

  static AssetFaceWithoutPersonResponseDtoSourceTypeEnum? fromJson(dynamic value) => AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer().decode(value);

  static List<AssetFaceWithoutPersonResponseDtoSourceTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceWithoutPersonResponseDtoSourceTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceWithoutPersonResponseDtoSourceTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetFaceWithoutPersonResponseDtoSourceTypeEnum] to String,
/// and [decode] dynamic data back to [AssetFaceWithoutPersonResponseDtoSourceTypeEnum].
class AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer {
  factory AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer() => _instance ??= const AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer._();

  const AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer._();

  String encode(AssetFaceWithoutPersonResponseDtoSourceTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetFaceWithoutPersonResponseDtoSourceTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetFaceWithoutPersonResponseDtoSourceTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'machine-learning': return AssetFaceWithoutPersonResponseDtoSourceTypeEnum.machineLearning;
        case r'exif': return AssetFaceWithoutPersonResponseDtoSourceTypeEnum.exif;
        case r'manual': return AssetFaceWithoutPersonResponseDtoSourceTypeEnum.manual;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer] instance.
  static AssetFaceWithoutPersonResponseDtoSourceTypeEnumTypeTransformer? _instance;
}


