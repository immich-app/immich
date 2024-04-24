//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'tag_type_enum.g.dart';

class TagTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'OBJECT')
  static const TagTypeEnum OBJECT = _$OBJECT;
  @BuiltValueEnumConst(wireName: r'FACE')
  static const TagTypeEnum FACE = _$FACE;
  @BuiltValueEnumConst(wireName: r'CUSTOM')
  static const TagTypeEnum CUSTOM = _$CUSTOM;

  static Serializer<TagTypeEnum> get serializer => _$tagTypeEnumSerializer;

  const TagTypeEnum._(String name): super(name);

  static BuiltSet<TagTypeEnum> get values => _$values;
  static TagTypeEnum valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class TagTypeEnumMixin = Object with _$TagTypeEnumMixin;

