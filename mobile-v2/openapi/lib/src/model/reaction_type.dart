//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'reaction_type.g.dart';

class ReactionType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'comment')
  static const ReactionType comment = _$comment;
  @BuiltValueEnumConst(wireName: r'like')
  static const ReactionType like = _$like;

  static Serializer<ReactionType> get serializer => _$reactionTypeSerializer;

  const ReactionType._(String name): super(name);

  static BuiltSet<ReactionType> get values => _$values;
  static ReactionType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ReactionTypeMixin = Object with _$ReactionTypeMixin;

