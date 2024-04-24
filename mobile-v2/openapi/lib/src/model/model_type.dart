//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'model_type.g.dart';

class ModelType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'facial-recognition')
  static const ModelType facialRecognition = _$facialRecognition;
  @BuiltValueEnumConst(wireName: r'clip')
  static const ModelType clip = _$clip;

  static Serializer<ModelType> get serializer => _$modelTypeSerializer;

  const ModelType._(String name): super(name);

  static BuiltSet<ModelType> get values => _$values;
  static ModelType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ModelTypeMixin = Object with _$ModelTypeMixin;

