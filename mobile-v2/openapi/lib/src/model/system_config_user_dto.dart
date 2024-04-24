//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_user_dto.g.dart';

/// SystemConfigUserDto
///
/// Properties:
/// * [deleteDelay] 
@BuiltValue()
abstract class SystemConfigUserDto implements Built<SystemConfigUserDto, SystemConfigUserDtoBuilder> {
  @BuiltValueField(wireName: r'deleteDelay')
  int get deleteDelay;

  SystemConfigUserDto._();

  factory SystemConfigUserDto([void updates(SystemConfigUserDtoBuilder b)]) = _$SystemConfigUserDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigUserDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigUserDto> get serializer => _$SystemConfigUserDtoSerializer();
}

class _$SystemConfigUserDtoSerializer implements PrimitiveSerializer<SystemConfigUserDto> {
  @override
  final Iterable<Type> types = const [SystemConfigUserDto, _$SystemConfigUserDto];

  @override
  final String wireName = r'SystemConfigUserDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'deleteDelay';
    yield serializers.serialize(
      object.deleteDelay,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigUserDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigUserDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'deleteDelay':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.deleteDelay = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigUserDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigUserDtoBuilder();
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

