//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'exif_response_dto.g.dart';

/// ExifResponseDto
///
/// Properties:
/// * [city] 
/// * [country] 
/// * [dateTimeOriginal] 
/// * [description] 
/// * [exifImageHeight] 
/// * [exifImageWidth] 
/// * [exposureTime] 
/// * [fNumber] 
/// * [fileSizeInByte] 
/// * [focalLength] 
/// * [iso] 
/// * [latitude] 
/// * [lensModel] 
/// * [longitude] 
/// * [make] 
/// * [model] 
/// * [modifyDate] 
/// * [orientation] 
/// * [projectionType] 
/// * [state] 
/// * [timeZone] 
@BuiltValue()
abstract class ExifResponseDto implements Built<ExifResponseDto, ExifResponseDtoBuilder> {
  @BuiltValueField(wireName: r'city')
  String? get city;

  @BuiltValueField(wireName: r'country')
  String? get country;

  @BuiltValueField(wireName: r'dateTimeOriginal')
  DateTime? get dateTimeOriginal;

  @BuiltValueField(wireName: r'description')
  String? get description;

  @BuiltValueField(wireName: r'exifImageHeight')
  num? get exifImageHeight;

  @BuiltValueField(wireName: r'exifImageWidth')
  num? get exifImageWidth;

  @BuiltValueField(wireName: r'exposureTime')
  String? get exposureTime;

  @BuiltValueField(wireName: r'fNumber')
  num? get fNumber;

  @BuiltValueField(wireName: r'fileSizeInByte')
  int? get fileSizeInByte;

  @BuiltValueField(wireName: r'focalLength')
  num? get focalLength;

  @BuiltValueField(wireName: r'iso')
  num? get iso;

  @BuiltValueField(wireName: r'latitude')
  num? get latitude;

  @BuiltValueField(wireName: r'lensModel')
  String? get lensModel;

  @BuiltValueField(wireName: r'longitude')
  num? get longitude;

  @BuiltValueField(wireName: r'make')
  String? get make;

  @BuiltValueField(wireName: r'model')
  String? get model;

  @BuiltValueField(wireName: r'modifyDate')
  DateTime? get modifyDate;

  @BuiltValueField(wireName: r'orientation')
  String? get orientation;

  @BuiltValueField(wireName: r'projectionType')
  String? get projectionType;

  @BuiltValueField(wireName: r'state')
  String? get state;

  @BuiltValueField(wireName: r'timeZone')
  String? get timeZone;

  ExifResponseDto._();

  factory ExifResponseDto([void updates(ExifResponseDtoBuilder b)]) = _$ExifResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ExifResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ExifResponseDto> get serializer => _$ExifResponseDtoSerializer();
}

class _$ExifResponseDtoSerializer implements PrimitiveSerializer<ExifResponseDto> {
  @override
  final Iterable<Type> types = const [ExifResponseDto, _$ExifResponseDto];

  @override
  final String wireName = r'ExifResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ExifResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.city != null) {
      yield r'city';
      yield serializers.serialize(
        object.city,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.country != null) {
      yield r'country';
      yield serializers.serialize(
        object.country,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.dateTimeOriginal != null) {
      yield r'dateTimeOriginal';
      yield serializers.serialize(
        object.dateTimeOriginal,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.description != null) {
      yield r'description';
      yield serializers.serialize(
        object.description,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.exifImageHeight != null) {
      yield r'exifImageHeight';
      yield serializers.serialize(
        object.exifImageHeight,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.exifImageWidth != null) {
      yield r'exifImageWidth';
      yield serializers.serialize(
        object.exifImageWidth,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.exposureTime != null) {
      yield r'exposureTime';
      yield serializers.serialize(
        object.exposureTime,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.fNumber != null) {
      yield r'fNumber';
      yield serializers.serialize(
        object.fNumber,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.fileSizeInByte != null) {
      yield r'fileSizeInByte';
      yield serializers.serialize(
        object.fileSizeInByte,
        specifiedType: const FullType.nullable(int),
      );
    }
    if (object.focalLength != null) {
      yield r'focalLength';
      yield serializers.serialize(
        object.focalLength,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.iso != null) {
      yield r'iso';
      yield serializers.serialize(
        object.iso,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.latitude != null) {
      yield r'latitude';
      yield serializers.serialize(
        object.latitude,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.lensModel != null) {
      yield r'lensModel';
      yield serializers.serialize(
        object.lensModel,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.longitude != null) {
      yield r'longitude';
      yield serializers.serialize(
        object.longitude,
        specifiedType: const FullType.nullable(num),
      );
    }
    if (object.make != null) {
      yield r'make';
      yield serializers.serialize(
        object.make,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.model != null) {
      yield r'model';
      yield serializers.serialize(
        object.model,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.modifyDate != null) {
      yield r'modifyDate';
      yield serializers.serialize(
        object.modifyDate,
        specifiedType: const FullType.nullable(DateTime),
      );
    }
    if (object.orientation != null) {
      yield r'orientation';
      yield serializers.serialize(
        object.orientation,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.projectionType != null) {
      yield r'projectionType';
      yield serializers.serialize(
        object.projectionType,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.state != null) {
      yield r'state';
      yield serializers.serialize(
        object.state,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.timeZone != null) {
      yield r'timeZone';
      yield serializers.serialize(
        object.timeZone,
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ExifResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ExifResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'city':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.city = valueDes;
          break;
        case r'country':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.country = valueDes;
          break;
        case r'dateTimeOriginal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.dateTimeOriginal = valueDes;
          break;
        case r'description':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.description = valueDes;
          break;
        case r'exifImageHeight':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.exifImageHeight = valueDes;
          break;
        case r'exifImageWidth':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.exifImageWidth = valueDes;
          break;
        case r'exposureTime':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.exposureTime = valueDes;
          break;
        case r'fNumber':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.fNumber = valueDes;
          break;
        case r'fileSizeInByte':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.fileSizeInByte = valueDes;
          break;
        case r'focalLength':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.focalLength = valueDes;
          break;
        case r'iso':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.iso = valueDes;
          break;
        case r'latitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.latitude = valueDes;
          break;
        case r'lensModel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.lensModel = valueDes;
          break;
        case r'longitude':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(num),
          ) as num?;
          if (valueDes == null) continue;
          result.longitude = valueDes;
          break;
        case r'make':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.make = valueDes;
          break;
        case r'model':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.model = valueDes;
          break;
        case r'modifyDate':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.modifyDate = valueDes;
          break;
        case r'orientation':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.orientation = valueDes;
          break;
        case r'projectionType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.projectionType = valueDes;
          break;
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.state = valueDes;
          break;
        case r'timeZone':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.timeZone = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ExifResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ExifResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

