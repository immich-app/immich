//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/user_avatar_color.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_user_dto.g.dart';

/// UpdateUserDto
///
/// Properties:
/// * [avatarColor] 
/// * [email] 
/// * [id] 
/// * [isAdmin] 
/// * [memoriesEnabled] 
/// * [name] 
/// * [password] 
/// * [quotaSizeInBytes] 
/// * [shouldChangePassword] 
/// * [storageLabel] 
@BuiltValue()
abstract class UpdateUserDto implements Built<UpdateUserDto, UpdateUserDtoBuilder> {
  @BuiltValueField(wireName: r'avatarColor')
  UserAvatarColor? get avatarColor;
  // enum avatarColorEnum {  primary,  pink,  red,  yellow,  blue,  green,  purple,  orange,  gray,  amber,  };

  @BuiltValueField(wireName: r'email')
  String? get email;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isAdmin')
  bool? get isAdmin;

  @BuiltValueField(wireName: r'memoriesEnabled')
  bool? get memoriesEnabled;

  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'password')
  String? get password;

  @BuiltValueField(wireName: r'quotaSizeInBytes')
  int? get quotaSizeInBytes;

  @BuiltValueField(wireName: r'shouldChangePassword')
  bool? get shouldChangePassword;

  @BuiltValueField(wireName: r'storageLabel')
  String? get storageLabel;

  UpdateUserDto._();

  factory UpdateUserDto([void updates(UpdateUserDtoBuilder b)]) = _$UpdateUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateUserDto> get serializer => _$UpdateUserDtoSerializer();
}

class _$UpdateUserDtoSerializer implements PrimitiveSerializer<UpdateUserDto> {
  @override
  final Iterable<Type> types = const [UpdateUserDto, _$UpdateUserDto];

  @override
  final String wireName = r'UpdateUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.avatarColor != null) {
      yield r'avatarColor';
      yield serializers.serialize(
        object.avatarColor,
        specifiedType: const FullType(UserAvatarColor),
      );
    }
    if (object.email != null) {
      yield r'email';
      yield serializers.serialize(
        object.email,
        specifiedType: const FullType(String),
      );
    }
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    if (object.isAdmin != null) {
      yield r'isAdmin';
      yield serializers.serialize(
        object.isAdmin,
        specifiedType: const FullType(bool),
      );
    }
    if (object.memoriesEnabled != null) {
      yield r'memoriesEnabled';
      yield serializers.serialize(
        object.memoriesEnabled,
        specifiedType: const FullType(bool),
      );
    }
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    if (object.password != null) {
      yield r'password';
      yield serializers.serialize(
        object.password,
        specifiedType: const FullType(String),
      );
    }
    if (object.quotaSizeInBytes != null) {
      yield r'quotaSizeInBytes';
      yield serializers.serialize(
        object.quotaSizeInBytes,
        specifiedType: const FullType.nullable(int),
      );
    }
    if (object.shouldChangePassword != null) {
      yield r'shouldChangePassword';
      yield serializers.serialize(
        object.shouldChangePassword,
        specifiedType: const FullType(bool),
      );
    }
    if (object.storageLabel != null) {
      yield r'storageLabel';
      yield serializers.serialize(
        object.storageLabel,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateUserDtoBuilder result,
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
        case r'isAdmin':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isAdmin = valueDes;
          break;
        case r'memoriesEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.memoriesEnabled = valueDes;
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        case r'quotaSizeInBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.quotaSizeInBytes = valueDes;
          break;
        case r'shouldChangePassword':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.shouldChangePassword = valueDes;
          break;
        case r'storageLabel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.storageLabel = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateUserDtoBuilder();
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

