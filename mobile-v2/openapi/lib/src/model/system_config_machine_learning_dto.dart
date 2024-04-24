//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/clip_config.dart';
import 'package:openapi/src/model/recognition_config.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'system_config_machine_learning_dto.g.dart';

/// SystemConfigMachineLearningDto
///
/// Properties:
/// * [clip] 
/// * [enabled] 
/// * [facialRecognition] 
/// * [url] 
@BuiltValue()
abstract class SystemConfigMachineLearningDto implements Built<SystemConfigMachineLearningDto, SystemConfigMachineLearningDtoBuilder> {
  @BuiltValueField(wireName: r'clip')
  CLIPConfig get clip;

  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'facialRecognition')
  RecognitionConfig get facialRecognition;

  @BuiltValueField(wireName: r'url')
  String get url;

  SystemConfigMachineLearningDto._();

  factory SystemConfigMachineLearningDto([void updates(SystemConfigMachineLearningDtoBuilder b)]) = _$SystemConfigMachineLearningDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(SystemConfigMachineLearningDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<SystemConfigMachineLearningDto> get serializer => _$SystemConfigMachineLearningDtoSerializer();
}

class _$SystemConfigMachineLearningDtoSerializer implements PrimitiveSerializer<SystemConfigMachineLearningDto> {
  @override
  final Iterable<Type> types = const [SystemConfigMachineLearningDto, _$SystemConfigMachineLearningDto];

  @override
  final String wireName = r'SystemConfigMachineLearningDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    SystemConfigMachineLearningDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'clip';
    yield serializers.serialize(
      object.clip,
      specifiedType: const FullType(CLIPConfig),
    );
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'facialRecognition';
    yield serializers.serialize(
      object.facialRecognition,
      specifiedType: const FullType(RecognitionConfig),
    );
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    SystemConfigMachineLearningDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required SystemConfigMachineLearningDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'clip':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CLIPConfig),
          ) as CLIPConfig;
          result.clip.replace(valueDes);
          break;
        case r'enabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.enabled = valueDes;
          break;
        case r'facialRecognition':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(RecognitionConfig),
          ) as RecognitionConfig;
          result.facialRecognition.replace(valueDes);
          break;
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  SystemConfigMachineLearningDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = SystemConfigMachineLearningDtoBuilder();
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

