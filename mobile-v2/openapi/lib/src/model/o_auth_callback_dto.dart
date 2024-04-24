//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'o_auth_callback_dto.g.dart';

/// OAuthCallbackDto
///
/// Properties:
/// * [url] 
@BuiltValue()
abstract class OAuthCallbackDto implements Built<OAuthCallbackDto, OAuthCallbackDtoBuilder> {
  @BuiltValueField(wireName: r'url')
  String get url;

  OAuthCallbackDto._();

  factory OAuthCallbackDto([void updates(OAuthCallbackDtoBuilder b)]) = _$OAuthCallbackDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(OAuthCallbackDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<OAuthCallbackDto> get serializer => _$OAuthCallbackDtoSerializer();
}

class _$OAuthCallbackDtoSerializer implements PrimitiveSerializer<OAuthCallbackDto> {
  @override
  final Iterable<Type> types = const [OAuthCallbackDto, _$OAuthCallbackDto];

  @override
  final String wireName = r'OAuthCallbackDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    OAuthCallbackDto object, {
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
    OAuthCallbackDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required OAuthCallbackDtoBuilder result,
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
  OAuthCallbackDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = OAuthCallbackDtoBuilder();
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

