//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/user_avatar_color.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_dto.g.dart';

/// UserDto
///
/// Properties:
/// * [avatarColor] 
/// * [email] 
/// * [id] 
/// * [name] 
/// * [profileImagePath] 
@BuiltValue()
abstract class UserDto implements Built<UserDto, UserDtoBuilder> {
  @BuiltValueField(wireName: r'avatarColor')
  UserAvatarColor get avatarColor;
  // enum avatarColorEnum {  primary,  pink,  red,  yellow,  blue,  green,  purple,  orange,  gray,  amber,  };

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'profileImagePath')
  String get profileImagePath;

  UserDto._();

  factory UserDto([void updates(UserDtoBuilder b)]) = _$UserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserDto> get serializer => _$UserDtoSerializer();
}

class _$UserDtoSerializer implements PrimitiveSerializer<UserDto> {
  @override
  final Iterable<Type> types = const [UserDto, _$UserDto];

  @override
  final String wireName = r'UserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'avatarColor';
    yield serializers.serialize(
      object.avatarColor,
      specifiedType: const FullType(UserAvatarColor),
    );
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'profileImagePath';
    yield serializers.serialize(
      object.profileImagePath,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'avatarColor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserAvatarColor),
          ) as UserAvatarColor;
          result.avatarColor = valueDes;
          break;
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'profileImagePath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.profileImagePath = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserDtoBuilder();
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

