//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_reverse_geocoding_dto.g.dart';

/// SystemConfigReverseGeocodingDto
///
/// Properties:
/// * [enabled] 
@BuiltValue()
abstract class SystemConfigReverseGeocodingDto implements Built<SystemConfigReverseGeocodingDto, SystemConfigReverseGeocodingDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SystemConfigReverseGeocodingDto._();

  factory SystemConfigReverseGeocodingDto([void updates(SystemConfigReverseGeocodingDtoBuilder b)]) = _$SystemConfigReverseGeocodingDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigReverseGeocodingDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigReverseGeocodingDto> get serializer => _$SystemConfigReverseGeocodingDtoSerializer();
}

class _$SystemConfigReverseGeocodingDtoSerializer implements PrimitiveSerializer<SystemConfigReverseGeocodingDto> {
  @override
  final Iterable<Type> types = const [SystemConfigReverseGeocodingDto, _$SystemConfigReverseGeocodingDto];

  @override
  final String wireName = r'SystemConfigReverseGeocodingDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigReverseGeocodingDto object, {
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
    SystemConfigReverseGeocodingDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigReverseGeocodingDtoBuilder result,
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
  SystemConfigReverseGeocodingDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigReverseGeocodingDtoBuilder();
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

