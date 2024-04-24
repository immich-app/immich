//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_server_dto.g.dart';

/// SystemConfigServerDto
///
/// Properties:
/// * [externalDomain] 
/// * [loginPageMessage] 
@BuiltValue()
abstract class SystemConfigServerDto implements Built<SystemConfigServerDto, SystemConfigServerDtoBuilder> {
  @BuiltValueField(wireName: r'externalDomain')
  String get externalDomain;

  @BuiltValueField(wireName: r'loginPageMessage')
  String get loginPageMessage;

  SystemConfigServerDto._();

  factory SystemConfigServerDto([void updates(SystemConfigServerDtoBuilder b)]) = _$SystemConfigServerDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigServerDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigServerDto> get serializer => _$SystemConfigServerDtoSerializer();
}

class _$SystemConfigServerDtoSerializer implements PrimitiveSerializer<SystemConfigServerDto> {
  @override
  final Iterable<Type> types = const [SystemConfigServerDto, _$SystemConfigServerDto];

  @override
  final String wireName = r'SystemConfigServerDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigServerDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'externalDomain';
    yield serializers.serialize(
      object.externalDomain,
      specifiedType: const FullType(String),
    );
    yield r'loginPageMessage';
    yield serializers.serialize(
      object.loginPageMessage,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigServerDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigServerDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'externalDomain':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.externalDomain = valueDes;
          break;
        case r'loginPageMessage':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.loginPageMessage = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigServerDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigServerDtoBuilder();
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

