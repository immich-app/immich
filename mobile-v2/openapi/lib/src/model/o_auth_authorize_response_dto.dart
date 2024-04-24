//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'o_auth_authorize_response_dto.g.dart';

/// OAuthAuthorizeResponseDto
///
/// Properties:
/// * [url] 
@BuiltValue()
abstract class OAuthAuthorizeResponseDto implements Built<OAuthAuthorizeResponseDto, OAuthAuthorizeResponseDtoBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  OAuthAuthorizeResponseDto._();

  factory OAuthAuthorizeResponseDto([void updates(OAuthAuthorizeResponseDtoBuilder b)]) = _$OAuthAuthorizeResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OAuthAuthorizeResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OAuthAuthorizeResponseDto> get serializer => _$OAuthAuthorizeResponseDtoSerializer();
}

class _$OAuthAuthorizeResponseDtoSerializer implements PrimitiveSerializer<OAuthAuthorizeResponseDto> {
  @override
  final Iterable<Type> types = const [OAuthAuthorizeResponseDto, _$OAuthAuthorizeResponseDto];

  @override
  final String wireName = r'OAuthAuthorizeResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OAuthAuthorizeResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OAuthAuthorizeResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required OAuthAuthorizeResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OAuthAuthorizeResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OAuthAuthorizeResponseDtoBuilder();
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

