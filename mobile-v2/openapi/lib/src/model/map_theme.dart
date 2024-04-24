//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'map_theme.g.dart';

class MapTheme extends EnumClass {

  @BuiltValueEnumConst(wireName: r'light')
  static const MapTheme light = _$light;
  @BuiltValueEnumConst(wireName: r'dark')
  static const MapTheme dark = _$dark;

  static Serializer<MapTheme> get serializer => _$mapThemeSerializer;

  const MapTheme._(String name): super(name);

  static BuiltSet<MapTheme> get values => _$values;
  static MapTheme valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class MapThemeMixin = Object with _$MapThemeMixin;

