//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_password_login_dto.g.dart';

/// SystemConfigPasswordLoginDto
///
/// Properties:
/// * [enabled] 
@BuiltValue()
abstract class SystemConfigPasswordLoginDto implements Built<SystemConfigPasswordLoginDto, SystemConfigPasswordLoginDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SystemConfigPasswordLoginDto._();

  factory SystemConfigPasswordLoginDto([void updates(SystemConfigPasswordLoginDtoBuilder b)]) = _$SystemConfigPasswordLoginDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigPasswordLoginDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigPasswordLoginDto> get serializer => _$SystemConfigPasswordLoginDtoSerializer();
}

class _$SystemConfigPasswordLoginDtoSerializer implements PrimitiveSerializer<SystemConfigPasswordLoginDto> {
  @override
  final Iterable<Type> types = const [SystemConfigPasswordLoginDto, _$SystemConfigPasswordLoginDto];

  @override
  final String wireName = r'SystemConfigPasswordLoginDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigPasswordLoginDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigPasswordLoginDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigPasswordLoginDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigPasswordLoginDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigPasswordLoginDtoBuilder();
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

