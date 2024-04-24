//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_theme_dto.g.dart';

/// SystemConfigThemeDto
///
/// Properties:
/// * [customCss] 
@BuiltValue()
abstract class SystemConfigThemeDto implements Built<SystemConfigThemeDto, SystemConfigThemeDtoBuilder> {
  @BuiltValueField(wireName: r'customCss')
  String get customCss;

  SystemConfigThemeDto._();

  factory SystemConfigThemeDto([void updates(SystemConfigThemeDtoBuilder b)]) = _$SystemConfigThemeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigThemeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigThemeDto> get serializer => _$SystemConfigThemeDtoSerializer();
}

class _$SystemConfigThemeDtoSerializer implements PrimitiveSerializer<SystemConfigThemeDto> {
  @override
  final Iterable<Type> types = const [SystemConfigThemeDto, _$SystemConfigThemeDto];

  @override
  final String wireName = r'SystemConfigThemeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigThemeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'customCss';
    yield serializers.serialize(
      object.customCss,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigThemeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigThemeDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'customCss':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.customCss = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigThemeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigThemeDtoBuilder();
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

