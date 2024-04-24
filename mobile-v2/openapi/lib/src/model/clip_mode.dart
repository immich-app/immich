//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'clip_mode.g.dart';

class CLIPMode extends EnumClass {

  @BuiltValueEnumConst(wireName: r'vision')
  static const CLIPMode vision = _$vision;
  @BuiltValueEnumConst(wireName: r'text')
  static const CLIPMode text = _$text;

  static Serializer<CLIPMode> get serializer => _$cLIPModeSerializer;

  const CLIPMode._(String name): super(name);

  static BuiltSet<CLIPMode> get values => _$values;
  static CLIPMode valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class CLIPModeMixin = Object with _$CLIPModeMixin;

