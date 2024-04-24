//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tone_mapping.g.dart';

class ToneMapping extends EnumClass {

  @BuiltValueEnumConst(wireName: r'hable')
  static const ToneMapping hable = _$hable;
  @BuiltValueEnumConst(wireName: r'mobius')
  static const ToneMapping mobius = _$mobius;
  @BuiltValueEnumConst(wireName: r'reinhard')
  static const ToneMapping reinhard = _$reinhard;
  @BuiltValueEnumConst(wireName: r'disabled')
  static const ToneMapping disabled = _$disabled;

  static Serializer<ToneMapping> get serializer => _$toneMappingSerializer;

  const ToneMapping._(String name): super(name);

  static BuiltSet<ToneMapping> get values => _$values;
  static ToneMapping valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ToneMappingMixin = Object with _$ToneMappingMixin;

