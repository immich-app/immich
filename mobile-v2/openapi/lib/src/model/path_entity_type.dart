//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'path_entity_type.g.dart';

class PathEntityType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asset')
  static const PathEntityType asset = _$asset;
  @BuiltValueEnumConst(wireName: r'person')
  static const PathEntityType person = _$person;
  @BuiltValueEnumConst(wireName: r'user')
  static const PathEntityType user = _$user;

  static Serializer<PathEntityType> get serializer => _$pathEntityTypeSerializer;

  const PathEntityType._(String name): super(name);

  static BuiltSet<PathEntityType> get values => _$values;
  static PathEntityType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class PathEntityTypeMixin = Object with _$PathEntityTypeMixin;

