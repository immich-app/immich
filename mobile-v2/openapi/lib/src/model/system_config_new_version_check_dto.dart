//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_new_version_check_dto.g.dart';

/// SystemConfigNewVersionCheckDto
///
/// Properties:
/// * [enabled] 
@BuiltValue()
abstract class SystemConfigNewVersionCheckDto implements Built<SystemConfigNewVersionCheckDto, SystemConfigNewVersionCheckDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SystemConfigNewVersionCheckDto._();

  factory SystemConfigNewVersionCheckDto([void updates(SystemConfigNewVersionCheckDtoBuilder b)]) = _$SystemConfigNewVersionCheckDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigNewVersionCheckDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigNewVersionCheckDto> get serializer => _$SystemConfigNewVersionCheckDtoSerializer();
}

class _$SystemConfigNewVersionCheckDtoSerializer implements PrimitiveSerializer<SystemConfigNewVersionCheckDto> {
  @override
  final Iterable<Type> types = const [SystemConfigNewVersionCheckDto, _$SystemConfigNewVersionCheckDto];

  @override
  final String wireName = r'SystemConfigNewVersionCheckDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigNewVersionCheckDto object, {
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
    SystemConfigNewVersionCheckDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigNewVersionCheckDtoBuilder result,
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
  SystemConfigNewVersionCheckDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigNewVersionCheckDtoBuilder();
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

