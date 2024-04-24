//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_trash_dto.g.dart';

/// SystemConfigTrashDto
///
/// Properties:
/// * [days] 
/// * [enabled] 
@BuiltValue()
abstract class SystemConfigTrashDto implements Built<SystemConfigTrashDto, SystemConfigTrashDtoBuilder> {
  @BuiltValueField(wireName: r'days')
  int get days;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SystemConfigTrashDto._();

  factory SystemConfigTrashDto([void updates(SystemConfigTrashDtoBuilder b)]) = _$SystemConfigTrashDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigTrashDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigTrashDto> get serializer => _$SystemConfigTrashDtoSerializer();
}

class _$SystemConfigTrashDtoSerializer implements PrimitiveSerializer<SystemConfigTrashDto> {
  @override
  final Iterable<Type> types = const [SystemConfigTrashDto, _$SystemConfigTrashDto];

  @override
  final String wireName = r'SystemConfigTrashDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigTrashDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'days';
    yield serializers.serialize(
      object.days,
      specifiedType: const FullType(int),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigTrashDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigTrashDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'days':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.days = valueDes;
          break;
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
  SystemConfigTrashDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigTrashDtoBuilder();
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

