//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_level.g.dart';

class ReactionLevel extends EnumClass {

  @BuiltValueEnumConst(wireName: r'album')
  static const ReactionLevel album = _$album;
  @BuiltValueEnumConst(wireName: r'asset')
  static const ReactionLevel asset = _$asset;

  static Serializer<ReactionLevel> get serializer => _$reactionLevelSerializer;

  const ReactionLevel._(String name): super(name);

  static BuiltSet<ReactionLevel> get values => _$values;
  static ReactionLevel valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ReactionLevelMixin = Object with _$ReactionLevelMixin;

