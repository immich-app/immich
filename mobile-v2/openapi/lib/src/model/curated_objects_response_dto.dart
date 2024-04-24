//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'curated_objects_response_dto.g.dart';

/// CuratedObjectsResponseDto
///
/// Properties:
/// * [deviceAssetId] 
/// * [deviceId] 
/// * [id] 
/// * [object] 
/// * [resizePath] 
@BuiltValue()
abstract class CuratedObjectsResponseDto implements Built<CuratedObjectsResponseDto, CuratedObjectsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'deviceAssetId')
  String get deviceAssetId;

  @BuiltValueField(wireName: r'deviceId')
  String get deviceId;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'object')
  String get object;

  @BuiltValueField(wireName: r'resizePath')
  String get resizePath;

  CuratedObjectsResponseDto._();

  factory CuratedObjectsResponseDto([void updates(CuratedObjectsResponseDtoBuilder b)]) = _$CuratedObjectsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CuratedObjectsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CuratedObjectsResponseDto> get serializer => _$CuratedObjectsResponseDtoSerializer();
}

class _$CuratedObjectsResponseDtoSerializer implements PrimitiveSerializer<CuratedObjectsResponseDto> {
  @override
  final Iterable<Type> types = const [CuratedObjectsResponseDto, _$CuratedObjectsResponseDto];

  @override
  final String wireName = r'CuratedObjectsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CuratedObjectsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
    yield r'object';
    yield serializers.serialize(
      object.object,
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
    CuratedObjectsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CuratedObjectsResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        case r'object':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.object = valueDes;
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
  CuratedObjectsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CuratedObjectsResponseDtoBuilder();
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

