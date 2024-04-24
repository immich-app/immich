//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'validate_access_token_response_dto.g.dart';

/// ValidateAccessTokenResponseDto
///
/// Properties:
/// * [authStatus] 
@BuiltValue()
abstract class ValidateAccessTokenResponseDto implements Built<ValidateAccessTokenResponseDto, ValidateAccessTokenResponseDtoBuilder> {
  @BuiltValueField(wireName: r'authStatus')
  bool get authStatus;

  ValidateAccessTokenResponseDto._();

  factory ValidateAccessTokenResponseDto([void updates(ValidateAccessTokenResponseDtoBuilder b)]) = _$ValidateAccessTokenResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ValidateAccessTokenResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ValidateAccessTokenResponseDto> get serializer => _$ValidateAccessTokenResponseDtoSerializer();
}

class _$ValidateAccessTokenResponseDtoSerializer implements PrimitiveSerializer<ValidateAccessTokenResponseDto> {
  @override
  final Iterable<Type> types = const [ValidateAccessTokenResponseDto, _$ValidateAccessTokenResponseDto];

  @override
  final String wireName = r'ValidateAccessTokenResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ValidateAccessTokenResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'authStatus';
    yield serializers.serialize(
      object.authStatus,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ValidateAccessTokenResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ValidateAccessTokenResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'authStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.authStatus = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ValidateAccessTokenResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ValidateAccessTokenResponseDtoBuilder();
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

