//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'user_avatar_color.g.dart';

class UserAvatarColor extends EnumClass {

  @BuiltValueEnumConst(wireName: r'primary')
  static const UserAvatarColor primary = _$primary;
  @BuiltValueEnumConst(wireName: r'pink')
  static const UserAvatarColor pink = _$pink;
  @BuiltValueEnumConst(wireName: r'red')
  static const UserAvatarColor red = _$red;
  @BuiltValueEnumConst(wireName: r'yellow')
  static const UserAvatarColor yellow = _$yellow;
  @BuiltValueEnumConst(wireName: r'blue')
  static const UserAvatarColor blue = _$blue;
  @BuiltValueEnumConst(wireName: r'green')
  static const UserAvatarColor green = _$green;
  @BuiltValueEnumConst(wireName: r'purple')
  static const UserAvatarColor purple = _$purple;
  @BuiltValueEnumConst(wireName: r'orange')
  static const UserAvatarColor orange = _$orange;
  @BuiltValueEnumConst(wireName: r'gray')
  static const UserAvatarColor gray = _$gray;
  @BuiltValueEnumConst(wireName: r'amber')
  static const UserAvatarColor amber = _$amber;

  static Serializer<UserAvatarColor> get serializer => _$userAvatarColorSerializer;

  const UserAvatarColor._(String name): super(name);

  static BuiltSet<UserAvatarColor> get values => _$values;
  static UserAvatarColor valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class UserAvatarColorMixin = Object with _$UserAvatarColorMixin;

