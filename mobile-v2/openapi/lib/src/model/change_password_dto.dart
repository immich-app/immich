//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'change_password_dto.g.dart';

/// ChangePasswordDto
///
/// Properties:
/// * [newPassword] 
/// * [password] 
@BuiltValue()
abstract class ChangePasswordDto implements Built<ChangePasswordDto, ChangePasswordDtoBuilder> {
  @BuiltValueField(wireName: r'newPassword')
  String get newPassword;

  @BuiltValueField(wireName: r'password')
  String get password;

  ChangePasswordDto._();

  factory ChangePasswordDto([void updates(ChangePasswordDtoBuilder b)]) = _$ChangePasswordDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ChangePasswordDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ChangePasswordDto> get serializer => _$ChangePasswordDtoSerializer();
}

class _$ChangePasswordDtoSerializer implements PrimitiveSerializer<ChangePasswordDto> {
  @override
  final Iterable<Type> types = const [ChangePasswordDto, _$ChangePasswordDto];

  @override
  final String wireName = r'ChangePasswordDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ChangePasswordDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'newPassword';
    yield serializers.serialize(
      object.newPassword,
      specifiedType: const FullType(String),
    );
    yield r'password';
    yield serializers.serialize(
      object.password,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ChangePasswordDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ChangePasswordDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'newPassword':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.newPassword = valueDes;
          break;
        case r'password':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.password = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ChangePasswordDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ChangePasswordDtoBuilder();
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

