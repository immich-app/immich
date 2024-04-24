//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/log_level.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_logging_dto.g.dart';

/// SystemConfigLoggingDto
///
/// Properties:
/// * [enabled] 
/// * [level] 
@BuiltValue()
abstract class SystemConfigLoggingDto implements Built<SystemConfigLoggingDto, SystemConfigLoggingDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'level')
  LogLevel get level;
  // enum levelEnum {  verbose,  debug,  log,  warn,  error,  fatal,  };

  SystemConfigLoggingDto._();

  factory SystemConfigLoggingDto([void updates(SystemConfigLoggingDtoBuilder b)]) = _$SystemConfigLoggingDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigLoggingDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigLoggingDto> get serializer => _$SystemConfigLoggingDtoSerializer();
}

class _$SystemConfigLoggingDtoSerializer implements PrimitiveSerializer<SystemConfigLoggingDto> {
  @override
  final Iterable<Type> types = const [SystemConfigLoggingDto, _$SystemConfigLoggingDto];

  @override
  final String wireName = r'SystemConfigLoggingDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigLoggingDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'level';
    yield serializers.serialize(
      object.level,
      specifiedType: const FullType(LogLevel),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigLoggingDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigLoggingDtoBuilder result,
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
        case r'level':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LogLevel),
          ) as LogLevel;
          result.level = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigLoggingDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigLoggingDtoBuilder();
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

