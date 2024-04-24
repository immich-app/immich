//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/system_config_library_watch_dto.dart';
import 'package:openapi/src/model/system_config_library_scan_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_library_dto.g.dart';

/// SystemConfigLibraryDto
///
/// Properties:
/// * [scan] 
/// * [watch] 
@BuiltValue()
abstract class SystemConfigLibraryDto implements Built<SystemConfigLibraryDto, SystemConfigLibraryDtoBuilder> {
  @BuiltValueField(wireName: r'scan')
  SystemConfigLibraryScanDto get scan;

  @BuiltValueField(wireName: r'watch')
  SystemConfigLibraryWatchDto get watch;

  SystemConfigLibraryDto._();

  factory SystemConfigLibraryDto([void updates(SystemConfigLibraryDtoBuilder b)]) = _$SystemConfigLibraryDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigLibraryDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigLibraryDto> get serializer => _$SystemConfigLibraryDtoSerializer();
}

class _$SystemConfigLibraryDtoSerializer implements PrimitiveSerializer<SystemConfigLibraryDto> {
  @override
  final Iterable<Type> types = const [SystemConfigLibraryDto, _$SystemConfigLibraryDto];

  @override
  final String wireName = r'SystemConfigLibraryDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'scan';
    yield serializers.serialize(
      object.scan,
      specifiedType: const FullType(SystemConfigLibraryScanDto),
    );
    yield r'watch';
    yield serializers.serialize(
      object.watch,
      specifiedType: const FullType(SystemConfigLibraryWatchDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigLibraryDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigLibraryDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'scan':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigLibraryScanDto),
          ) as SystemConfigLibraryScanDto;
          result.scan.replace(valueDes);
          break;
        case r'watch':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(SystemConfigLibraryWatchDto),
          ) as SystemConfigLibraryWatchDto;
          result.watch.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigLibraryDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigLibraryDtoBuilder();
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

