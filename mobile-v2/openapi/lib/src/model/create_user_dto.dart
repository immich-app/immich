//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_user_dto.g.dart';

/// CreateUserDto
///
/// Properties:
/// * [email] 
/// * [memoriesEnabled] 
/// * [name] 
/// * [password] 
/// * [quotaSizeInBytes] 
/// * [shouldChangePassword] 
/// * [storageLabel] 
@BuiltValue()
abstract class CreateUserDto implements Built<CreateUserDto, CreateUserDtoBuilder> {
  @BuiltValueField(wireName: r'email')
  String get email;

  @BuiltValueField(wireName: r'memoriesEnabled')
  bool? get memoriesEnabled;

  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'password')
  String get password;

  @BuiltValueField(wireName: r'quotaSizeInBytes')
  int? get quotaSizeInBytes;

  @BuiltValueField(wireName: r'shouldChangePassword')
  bool? get shouldChangePassword;

  @BuiltValueField(wireName: r'storageLabel')
  String? get storageLabel;

  CreateUserDto._();

  factory CreateUserDto([void updates(CreateUserDtoBuilder b)]) = _$CreateUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateUserDto> get serializer => _$CreateUserDtoSerializer();
}

class _$CreateUserDtoSerializer implements PrimitiveSerializer<CreateUserDto> {
  @override
  final Iterable<Type> types = const [CreateUserDto, _$CreateUserDto];

  @override
  final String wireName = r'CreateUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'email';
    yield serializers.serialize(
      object.email,
      specifiedType: const FullType(String),
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
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
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
        specifiedType: const FullType.nullable(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateUserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'email':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.email = valueDes;
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
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
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
  CreateUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateUserDtoBuilder();
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

