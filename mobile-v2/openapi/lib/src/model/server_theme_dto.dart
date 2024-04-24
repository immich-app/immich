//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'server_theme_dto.g.dart';

/// ServerThemeDto
///
/// Properties:
/// * [customCss] 
@BuiltValue()
abstract class ServerThemeDto implements Built<ServerThemeDto, ServerThemeDtoBuilder> {
  @BuiltValueField(wireName: r'customCss')
  String get customCss;

  ServerThemeDto._();

  factory ServerThemeDto([void updates(ServerThemeDtoBuilder b)]) = _$ServerThemeDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ServerThemeDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ServerThemeDto> get serializer => _$ServerThemeDtoSerializer();
}

class _$ServerThemeDtoSerializer implements PrimitiveSerializer<ServerThemeDto> {
  @override
  final Iterable<Type> types = const [ServerThemeDto, _$ServerThemeDto];

  @override
  final String wireName = r'ServerThemeDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ServerThemeDto object, {
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
    ServerThemeDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ServerThemeDtoBuilder result,
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
  ServerThemeDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ServerThemeDtoBuilder();
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

