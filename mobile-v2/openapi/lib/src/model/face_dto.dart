//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'face_dto.g.dart';

/// FaceDto
///
/// Properties:
/// * [id] 
@BuiltValue()
abstract class FaceDto implements Built<FaceDto, FaceDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  FaceDto._();

  factory FaceDto([void updates(FaceDtoBuilder b)]) = _$FaceDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(FaceDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<FaceDto> get serializer => _$FaceDtoSerializer();
}

class _$FaceDtoSerializer implements PrimitiveSerializer<FaceDto> {
  @override
  final Iterable<Type> types = const [FaceDto, _$FaceDto];

  @override
  final String wireName = r'FaceDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    FaceDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    FaceDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required FaceDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  FaceDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = FaceDtoBuilder();
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

