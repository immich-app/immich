//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'memory_type.g.dart';

class MemoryType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'on_this_day')
  static const MemoryType onThisDay = _$onThisDay;

  static Serializer<MemoryType> get serializer => _$memoryTypeSerializer;

  const MemoryType._(String name): super(name);

  static BuiltSet<MemoryType> get values => _$values;
  static MemoryType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class MemoryTypeMixin = Object with _$MemoryTypeMixin;

