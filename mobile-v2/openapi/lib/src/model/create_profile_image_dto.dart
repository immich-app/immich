//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'dart:typed_data';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_profile_image_dto.g.dart';

/// CreateProfileImageDto
///
/// Properties:
/// * [file] 
@BuiltValue()
abstract class CreateProfileImageDto implements Built<CreateProfileImageDto, CreateProfileImageDtoBuilder> {
  @BuiltValueField(wireName: r'file')
  Uint8List get file;

  CreateProfileImageDto._();

  factory CreateProfileImageDto([void updates(CreateProfileImageDtoBuilder b)]) = _$CreateProfileImageDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateProfileImageDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateProfileImageDto> get serializer => _$CreateProfileImageDtoSerializer();
}

class _$CreateProfileImageDtoSerializer implements PrimitiveSerializer<CreateProfileImageDto> {
  @override
  final Iterable<Type> types = const [CreateProfileImageDto, _$CreateProfileImageDto];

  @override
  final String wireName = r'CreateProfileImageDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateProfileImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'file';
    yield serializers.serialize(
      object.file,
      specifiedType: const FullType(Uint8List),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateProfileImageDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateProfileImageDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'file':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(Uint8List),
          ) as Uint8List;
          result.file = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateProfileImageDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateProfileImageDtoBuilder();
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

