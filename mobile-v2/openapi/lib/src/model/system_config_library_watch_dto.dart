//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_library_watch_dto.g.dart';

/// SystemConfigLibraryWatchDto
///
/// Properties:
/// * [enabled] 
@BuiltValue()
abstract class SystemConfigLibraryWatchDto implements Built<SystemConfigLibraryWatchDto, SystemConfigLibraryWatchDtoBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  SystemConfigLibraryWatchDto._();

  factory SystemConfigLibraryWatchDto([void updates(SystemConfigLibraryWatchDtoBuilder b)]) = _$SystemConfigLibraryWatchDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigLibraryWatchDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigLibraryWatchDto> get serializer => _$SystemConfigLibraryWatchDtoSerializer();
}

class _$SystemConfigLibraryWatchDtoSerializer implements PrimitiveSerializer<SystemConfigLibraryWatchDto> {
  @override
  final Iterable<Type> types = const [SystemConfigLibraryWatchDto, _$SystemConfigLibraryWatchDto];

  @override
  final String wireName = r'SystemConfigLibraryWatchDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigLibraryWatchDto object, {
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
    SystemConfigLibraryWatchDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigLibraryWatchDtoBuilder result,
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
  SystemConfigLibraryWatchDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigLibraryWatchDtoBuilder();
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

