//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/model_type.dart';
import 'package:openapi/src/model/clip_mode.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'clip_config.g.dart';

/// CLIPConfig
///
/// Properties:
/// * [enabled] 
/// * [mode] 
/// * [modelName] 
/// * [modelType] 
@BuiltValue()
abstract class CLIPConfig implements Built<CLIPConfig, CLIPConfigBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'mode')
  CLIPMode? get mode;
  // enum modeEnum {  vision,  text,  };

  @BuiltValueField(wireName: r'modelName')
  String get modelName;

  @BuiltValueField(wireName: r'modelType')
  ModelType? get modelType;
  // enum modelTypeEnum {  facial-recognition,  clip,  };

  CLIPConfig._();

  factory CLIPConfig([void updates(CLIPConfigBuilder b)]) = _$CLIPConfig;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CLIPConfigBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CLIPConfig> get serializer => _$CLIPConfigSerializer();
}

class _$CLIPConfigSerializer implements PrimitiveSerializer<CLIPConfig> {
  @override
  final Iterable<Type> types = const [CLIPConfig, _$CLIPConfig];

  @override
  final String wireName = r'CLIPConfig';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CLIPConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    if (object.mode != null) {
      yield r'mode';
      yield serializers.serialize(
        object.mode,
        specifiedType: const FullType(CLIPMode),
      );
    }
    yield r'modelName';
    yield serializers.serialize(
      object.modelName,
      specifiedType: const FullType(String),
    );
    if (object.modelType != null) {
      yield r'modelType';
      yield serializers.serialize(
        object.modelType,
        specifiedType: const FullType(ModelType),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CLIPConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CLIPConfigBuilder result,
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
        case r'mode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CLIPMode),
          ) as CLIPMode;
          result.mode = valueDes;
          break;
        case r'modelName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.modelName = valueDes;
          break;
        case r'modelType':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ModelType),
          ) as ModelType;
          result.modelType = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CLIPConfig deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CLIPConfigBuilder();
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

