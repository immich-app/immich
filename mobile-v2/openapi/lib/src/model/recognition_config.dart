//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/model_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'recognition_config.g.dart';

/// RecognitionConfig
///
/// Properties:
/// * [enabled] 
/// * [maxDistance] 
/// * [minFaces] 
/// * [minScore] 
/// * [modelName] 
/// * [modelType] 
@BuiltValue()
abstract class RecognitionConfig implements Built<RecognitionConfig, RecognitionConfigBuilder> {
  @BuiltValueField(wireName: r'enabled')
  bool get enabled;

  @BuiltValueField(wireName: r'maxDistance')
  double get maxDistance;

  @BuiltValueField(wireName: r'minFaces')
  int get minFaces;

  @BuiltValueField(wireName: r'minScore')
  double get minScore;

  @BuiltValueField(wireName: r'modelName')
  String get modelName;

  @BuiltValueField(wireName: r'modelType')
  ModelType? get modelType;
  // enum modelTypeEnum {  facial-recognition,  clip,  };

  RecognitionConfig._();

  factory RecognitionConfig([void updates(RecognitionConfigBuilder b)]) = _$RecognitionConfig;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RecognitionConfigBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RecognitionConfig> get serializer => _$RecognitionConfigSerializer();
}

class _$RecognitionConfigSerializer implements PrimitiveSerializer<RecognitionConfig> {
  @override
  final Iterable<Type> types = const [RecognitionConfig, _$RecognitionConfig];

  @override
  final String wireName = r'RecognitionConfig';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RecognitionConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'enabled';
    yield serializers.serialize(
      object.enabled,
      specifiedType: const FullType(bool),
    );
    yield r'maxDistance';
    yield serializers.serialize(
      object.maxDistance,
      specifiedType: const FullType(double),
    );
    yield r'minFaces';
    yield serializers.serialize(
      object.minFaces,
      specifiedType: const FullType(int),
    );
    yield r'minScore';
    yield serializers.serialize(
      object.minScore,
      specifiedType: const FullType(double),
    );
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
    RecognitionConfig object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RecognitionConfigBuilder result,
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
        case r'maxDistance':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.maxDistance = valueDes;
          break;
        case r'minFaces':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.minFaces = valueDes;
          break;
        case r'minScore':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(double),
          ) as double;
          result.minScore = valueDes;
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
  RecognitionConfig deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RecognitionConfigBuilder();
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

