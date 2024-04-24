//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'entity_type.g.dart';

class EntityType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ASSET')
  static const EntityType ASSET = _$ASSET;
  @BuiltValueEnumConst(wireName: r'ALBUM')
  static const EntityType ALBUM = _$ALBUM;

  static Serializer<EntityType> get serializer => _$entityTypeSerializer;

  const EntityType._(String name): super(name);

  static BuiltSet<EntityType> get values => _$values;
  static EntityType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class EntityTypeMixin = Object with _$EntityTypeMixin;

