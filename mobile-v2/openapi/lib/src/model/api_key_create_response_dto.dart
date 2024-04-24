//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/api_key_response_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'api_key_create_response_dto.g.dart';

/// APIKeyCreateResponseDto
///
/// Properties:
/// * [apiKey] 
/// * [secret] 
@BuiltValue()
abstract class APIKeyCreateResponseDto implements Built<APIKeyCreateResponseDto, APIKeyCreateResponseDtoBuilder> {
  @BuiltValueField(wireName: r'apiKey')
  APIKeyResponseDto get apiKey;

  @BuiltValueField(wireName: r'secret')
  String get secret;

  APIKeyCreateResponseDto._();

  factory APIKeyCreateResponseDto([void updates(APIKeyCreateResponseDtoBuilder b)]) = _$APIKeyCreateResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(APIKeyCreateResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<APIKeyCreateResponseDto> get serializer => _$APIKeyCreateResponseDtoSerializer();
}

class _$APIKeyCreateResponseDtoSerializer implements PrimitiveSerializer<APIKeyCreateResponseDto> {
  @override
  final Iterable<Type> types = const [APIKeyCreateResponseDto, _$APIKeyCreateResponseDto];

  @override
  final String wireName = r'APIKeyCreateResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    APIKeyCreateResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'apiKey';
    yield serializers.serialize(
      object.apiKey,
      specifiedType: const FullType(APIKeyResponseDto),
    );
    yield r'secret';
    yield serializers.serialize(
      object.secret,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    APIKeyCreateResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required APIKeyCreateResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'apiKey':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(APIKeyResponseDto),
          ) as APIKeyResponseDto;
          result.apiKey.replace(valueDes);
          break;
        case r'secret':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.secret = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  APIKeyCreateResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = APIKeyCreateResponseDtoBuilder();
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

