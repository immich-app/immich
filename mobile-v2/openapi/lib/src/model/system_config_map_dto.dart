//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_map_dto.g.dart';

/// SystemConfigMapDto
///
/// Properties:
/// * [darkStyle] 
/// * [enabled] 
/// * [lightStyle] 
@BuiltValue()
abstract class SystemConfigMapDto implements Built<SystemConfigMapDto, SystemConfigMapDtoBuilder> {
  @BuiltValueField(wireName: r'darkStyle')
  String get darkStyle;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'lightStyle')
  String get lightStyle;

  SystemConfigMapDto._();

  factory SystemConfigMapDto([void updates(SystemConfigMapDtoBuilder b)]) = _$SystemConfigMapDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigMapDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigMapDto> get serializer => _$SystemConfigMapDtoSerializer();
}

class _$SystemConfigMapDtoSerializer implements PrimitiveSerializer<SystemConfigMapDto> {
  @override
  final Iterable<Type> types = const [SystemConfigMapDto, _$SystemConfigMapDto];

  @override
  final String wireName = r'SystemConfigMapDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigMapDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'darkStyle';
    yield serializers.serialize(
      object.darkStyle,
      specifiedType: const FullType(String),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'lightStyle';
    yield serializers.serialize(
      object.lightStyle,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigMapDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigMapDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'darkStyle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.darkStyle = valueDes;
          break;
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        case r'lightStyle':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lightStyle = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigMapDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigMapDtoBuilder();
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

