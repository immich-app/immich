//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/user_status.dart';
import 'package:openapi/src/model/user_avatar_color.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_response_dto.g.dart';

/// UserResponseDto
///
/// Properties:
/// * [avatarColor] 
/// * [createdAt] 
/// * [deletedAt] 
/// * [email] 
/// * [id] 
/// * [isAdmin] 
/// * [memoriesEnabled] 
/// * [name] 
/// * [oauthId] 
/// * [profileImagePath] 
/// * [quotaSizeInBytes] 
/// * [quotaUsageInBytes] 
/// * [shouldChangePassword] 
/// * [status] 
/// * [storageLabel] 
/// * [updatedAt] 
@BuiltValue()
abstract class UserResponseDto implements Built<UserResponseDto, UserResponseDtoBuilder> {
  @BuiltValueField(wireName: r'avatarColor')
  UserAvatarColor get avatarColor;
  // enum avatarColorEnum {  primary,  pink,  red,  yellow,  blue,  green,  purple,  orange,  gray,  amber,  };

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'deletedAt')
  DateTime? get deletedAt;

  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'isAdmin')
  bool get isAdmin;

  @BuiltValueField(wireName: r'memoriesEnabled')
  bool? get memoriesEnabled;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'oauthId')
  String get oauthId;

  @BuiltValueField(wireName: r'profileImagePath')
  String get profileImagePath;

  @BuiltValueField(wireName: r'quotaSizeInBytes')
  int? get quotaSizeInBytes;

  @BuiltValueField(wireName: r'quotaUsageInBytes')
  int? get quotaUsageInBytes;

  @BuiltValueField(wireName: r'shouldChangePassword')
  bool get shouldChangePassword;

  @BuiltValueField(wireName: r'status')
  UserStatus get status;
  // enum statusEnum {  active,  removing,  deleted,  };

  @BuiltValueField(wireName: r'storageLabel')
  String? get storageLabel;

  @BuiltValueField(wireName: r'updatedAt')
  DateTime get updatedAt;

  UserResponseDto._();

  factory UserResponseDto([void updates(UserResponseDtoBuilder b)]) = _$UserResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UserResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UserResponseDto> get serializer => _$UserResponseDtoSerializer();
}

class _$UserResponseDtoSerializer implements PrimitiveSerializer<UserResponseDto> {
  @override
  final Iterable<Type> types = const [UserResponseDto, _$UserResponseDto];

  @override
  final String wireName = r'UserResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UserResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'avatarColor';
    yield serializers.serialize(
      object.avatarColor,
      specifiedType: const FullType(UserAvatarColor),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'deletedAt';
    yield object.deletedAt == null ? null : serializers.serialize(
      object.deletedAt,
      specifiedType: const FullType.nullable(DateTime),
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
    yield r'isAdmin';
    yield serializers.serialize(
      object.isAdmin,
      specifiedType: const FullType(bool),
    );
    if (object.memoriesEnabled != null) {
      yield r'memoriesEnabled';
      yield serializers.serialize(
        object.memoriesEnabled,
        specifiedType: const FullType(bool),
      );
    }
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    yield r'oauthId';
    yield serializers.serialize(
      object.oauthId,
      specifiedType: const FullType(String),
    );
    yield r'profileImagePath';
    yield serializers.serialize(
      object.profileImagePath,
      specifiedType: const FullType(String),
    );
    yield r'quotaSizeInBytes';
    yield object.quotaSizeInBytes == null ? null : serializers.serialize(
      object.quotaSizeInBytes,
      specifiedType: const FullType.nullable(int),
    );
    yield r'quotaUsageInBytes';
    yield object.quotaUsageInBytes == null ? null : serializers.serialize(
      object.quotaUsageInBytes,
      specifiedType: const FullType.nullable(int),
    );
    yield r'shouldChangePassword';
    yield serializers.serialize(
      object.shouldChangePassword,
      specifiedType: const FullType(bool),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(UserStatus),
    );
    yield r'storageLabel';
    yield object.storageLabel == null ? null : serializers.serialize(
      object.storageLabel,
      specifiedType: const FullType.nullable(String),
    );
    yield r'updatedAt';
    yield serializers.serialize(
      object.updatedAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    UserResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UserResponseDtoBuilder result,
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'deletedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.deletedAt = valueDes;
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
        case r'oauthId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.oauthId = valueDes;
          break;
        case r'profileImagePath':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.profileImagePath = valueDes;
          break;
        case r'quotaSizeInBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.quotaSizeInBytes = valueDes;
          break;
        case r'quotaUsageInBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(int),
          ) as int?;
          if (valueDes == null) continue;
          result.quotaUsageInBytes = valueDes;
          break;
        case r'shouldChangePassword':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.shouldChangePassword = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserStatus),
          ) as UserStatus;
          result.status = valueDes;
          break;
        case r'storageLabel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.storageLabel = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.updatedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UserResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UserResponseDtoBuilder();
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

