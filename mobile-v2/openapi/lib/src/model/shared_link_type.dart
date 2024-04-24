//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'shared_link_type.g.dart';

class SharedLinkType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ALBUM')
  static const SharedLinkType ALBUM = _$ALBUM;
  @BuiltValueEnumConst(wireName: r'INDIVIDUAL')
  static const SharedLinkType INDIVIDUAL = _$INDIVIDUAL;

  static Serializer<SharedLinkType> get serializer => _$sharedLinkTypeSerializer;

  const SharedLinkType._(String name): super(name);

  static BuiltSet<SharedLinkType> get values => _$values;
  static SharedLinkType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class SharedLinkTypeMixin = Object with _$SharedLinkTypeMixin;

