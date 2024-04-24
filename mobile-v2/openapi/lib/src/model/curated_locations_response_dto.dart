//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'curated_locations_response_dto.g.dart';

/// CuratedLocationsResponseDto
///
/// Properties:
/// * [city] 
/// * [deviceAssetId] 
/// * [deviceId] 
/// * [id] 
/// * [resizePath] 
@BuiltValue()
abstract class CuratedLocationsResponseDto implements Built<CuratedLocationsResponseDto, CuratedLocationsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'city')
  String get city;

  @BuiltValueField(wireName: r'deviceAssetId')
  String get deviceAssetId;

  @BuiltValueField(wireName: r'deviceId')
  String get deviceId;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'resizePath')
  String get resizePath;

  CuratedLocationsResponseDto._();

  factory CuratedLocationsResponseDto([void updates(CuratedLocationsResponseDtoBuilder b)]) = _$CuratedLocationsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CuratedLocationsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CuratedLocationsResponseDto> get serializer => _$CuratedLocationsResponseDtoSerializer();
}

class _$CuratedLocationsResponseDtoSerializer implements PrimitiveSerializer<CuratedLocationsResponseDto> {
  @override
  final Iterable<Type> types = const [CuratedLocationsResponseDto, _$CuratedLocationsResponseDto];

  @override
  final String wireName = r'CuratedLocationsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CuratedLocationsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'city';
    yield serializers.serialize(
      object.city,
      specifiedType: const FullType(String),
    );
    yield r'deviceAssetId';
    yield serializers.serialize(
      object.deviceAssetId,
      specifiedType: const FullType(String),
    );
    yield r'deviceId';
    yield serializers.serialize(
      object.deviceId,
      specifiedType: const FullType(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'resizePath';
    yield serializers.serialize(
      object.resizePath,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CuratedLocationsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CuratedLocationsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'city':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.city = valueDes;
          break;
        case r'deviceAssetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceAssetId = valueDes;
          break;
        case r'deviceId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.deviceId = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'resizePath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.resizePath = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CuratedLocationsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CuratedLocationsResponseDtoBuilder();
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

