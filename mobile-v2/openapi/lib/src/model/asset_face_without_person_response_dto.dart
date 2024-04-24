//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'asset_face_without_person_response_dto.g.dart';

/// AssetFaceWithoutPersonResponseDto
///
/// Properties:
/// * [boundingBoxX1] 
/// * [boundingBoxX2] 
/// * [boundingBoxY1] 
/// * [boundingBoxY2] 
/// * [id] 
/// * [imageHeight] 
/// * [imageWidth] 
@BuiltValue()
abstract class AssetFaceWithoutPersonResponseDto implements Built<AssetFaceWithoutPersonResponseDto, AssetFaceWithoutPersonResponseDtoBuilder> {
  @BuiltValueField(wireName: r'boundingBoxX1')
  int get boundingBoxX1;

  @BuiltValueField(wireName: r'boundingBoxX2')
  int get boundingBoxX2;

  @BuiltValueField(wireName: r'boundingBoxY1')
  int get boundingBoxY1;

  @BuiltValueField(wireName: r'boundingBoxY2')
  int get boundingBoxY2;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'imageHeight')
  int get imageHeight;

  @BuiltValueField(wireName: r'imageWidth')
  int get imageWidth;

  AssetFaceWithoutPersonResponseDto._();

  factory AssetFaceWithoutPersonResponseDto([void updates(AssetFaceWithoutPersonResponseDtoBuilder b)]) = _$AssetFaceWithoutPersonResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AssetFaceWithoutPersonResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AssetFaceWithoutPersonResponseDto> get serializer => _$AssetFaceWithoutPersonResponseDtoSerializer();
}

class _$AssetFaceWithoutPersonResponseDtoSerializer implements PrimitiveSerializer<AssetFaceWithoutPersonResponseDto> {
  @override
  final Iterable<Type> types = const [AssetFaceWithoutPersonResponseDto, _$AssetFaceWithoutPersonResponseDto];

  @override
  final String wireName = r'AssetFaceWithoutPersonResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AssetFaceWithoutPersonResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'boundingBoxX1';
    yield serializers.serialize(
      object.boundingBoxX1,
      specifiedType: const FullType(int),
    );
    yield r'boundingBoxX2';
    yield serializers.serialize(
      object.boundingBoxX2,
      specifiedType: const FullType(int),
    );
    yield r'boundingBoxY1';
    yield serializers.serialize(
      object.boundingBoxY1,
      specifiedType: const FullType(int),
    );
    yield r'boundingBoxY2';
    yield serializers.serialize(
      object.boundingBoxY2,
      specifiedType: const FullType(int),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'imageHeight';
    yield serializers.serialize(
      object.imageHeight,
      specifiedType: const FullType(int),
    );
    yield r'imageWidth';
    yield serializers.serialize(
      object.imageWidth,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AssetFaceWithoutPersonResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AssetFaceWithoutPersonResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'boundingBoxX1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.boundingBoxX1 = valueDes;
          break;
        case r'boundingBoxX2':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.boundingBoxX2 = valueDes;
          break;
        case r'boundingBoxY1':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.boundingBoxY1 = valueDes;
          break;
        case r'boundingBoxY2':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.boundingBoxY2 = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'imageHeight':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.imageHeight = valueDes;
          break;
        case r'imageWidth':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.imageWidth = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AssetFaceWithoutPersonResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AssetFaceWithoutPersonResponseDtoBuilder();
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

