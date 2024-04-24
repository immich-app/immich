//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'o_auth_config_dto.g.dart';

/// OAuthConfigDto
///
/// Properties:
/// * [redirectUri] 
@BuiltValue()
abstract class OAuthConfigDto implements Built<OAuthConfigDto, OAuthConfigDtoBuilder> {
  @BuiltValueField(wireName: r'redirectUri')
  String get redirectUri;

  OAuthConfigDto._();

  factory OAuthConfigDto([void updates(OAuthConfigDtoBuilder b)]) = _$OAuthConfigDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OAuthConfigDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OAuthConfigDto> get serializer => _$OAuthConfigDtoSerializer();
}

class _$OAuthConfigDtoSerializer implements PrimitiveSerializer<OAuthConfigDto> {
  @override
  final Iterable<Type> types = const [OAuthConfigDto, _$OAuthConfigDto];

  @override
  final String wireName = r'OAuthConfigDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OAuthConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'redirectUri';
    yield serializers.serialize(
      object.redirectUri,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    OAuthConfigDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required OAuthConfigDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'redirectUri':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.redirectUri = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  OAuthConfigDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OAuthConfigDtoBuilder();
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

