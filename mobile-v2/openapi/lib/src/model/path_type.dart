//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'path_type.g.dart';

class PathType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'original')
  static const PathType original = _$original;
  @BuiltValueEnumConst(wireName: r'preview')
  static const PathType preview = _$preview;
  @BuiltValueEnumConst(wireName: r'thumbnail')
  static const PathType thumbnail = _$thumbnail;
  @BuiltValueEnumConst(wireName: r'encoded_video')
  static const PathType encodedVideo = _$encodedVideo;
  @BuiltValueEnumConst(wireName: r'sidecar')
  static const PathType sidecar = _$sidecar;
  @BuiltValueEnumConst(wireName: r'face')
  static const PathType face = _$face;
  @BuiltValueEnumConst(wireName: r'profile')
  static const PathType profile = _$profile;

  static Serializer<PathType> get serializer => _$pathTypeSerializer;

  const PathType._(String name): super(name);

  static BuiltSet<PathType> get values => _$values;
  static PathType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class PathTypeMixin = Object with _$PathTypeMixin;

