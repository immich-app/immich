//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'colorspace.g.dart';

class Colorspace extends EnumClass {

  @BuiltValueEnumConst(wireName: r'srgb')
  static const Colorspace srgb = _$srgb;
  @BuiltValueEnumConst(wireName: r'p3')
  static const Colorspace p3 = _$p3;

  static Serializer<Colorspace> get serializer => _$colorspaceSerializer;

  const Colorspace._(String name): super(name);

  static BuiltSet<Colorspace> get values => _$values;
  static Colorspace valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ColorspaceMixin = Object with _$ColorspaceMixin;

