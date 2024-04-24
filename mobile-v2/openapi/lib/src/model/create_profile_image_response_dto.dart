//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_profile_image_response_dto.g.dart';

/// CreateProfileImageResponseDto
///
/// Properties:
/// * [profileImagePath] 
/// * [userId] 
@BuiltValue()
abstract class CreateProfileImageResponseDto implements Built<CreateProfileImageResponseDto, CreateProfileImageResponseDtoBuilder> {
  @BuiltValueField(wireName: r'profileImagePath')
  String get profileImagePath;

  @BuiltValueField(wireName: r'userId')
  String get userId;

  CreateProfileImageResponseDto._();

  factory CreateProfileImageResponseDto([void updates(CreateProfileImageResponseDtoBuilder b)]) = _$CreateProfileImageResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateProfileImageResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateProfileImageResponseDto> get serializer => _$CreateProfileImageResponseDtoSerializer();
}

class _$CreateProfileImageResponseDtoSerializer implements PrimitiveSerializer<CreateProfileImageResponseDto> {
  @override
  final Iterable<Type> types = const [CreateProfileImageResponseDto, _$CreateProfileImageResponseDto];

  @override
  final String wireName = r'CreateProfileImageResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateProfileImageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'profileImagePath';
    yield serializers.serialize(
      object.profileImagePath,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateProfileImageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateProfileImageResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'profileImagePath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.profileImagePath = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateProfileImageResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateProfileImageResponseDtoBuilder();
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

