//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'thumbnail_format.g.dart';

class ThumbnailFormat extends EnumClass {

  @BuiltValueEnumConst(wireName: r'JPEG')
  static const ThumbnailFormat JPEG = _$JPEG;
  @BuiltValueEnumConst(wireName: r'WEBP')
  static const ThumbnailFormat WEBP = _$WEBP;

  static Serializer<ThumbnailFormat> get serializer => _$thumbnailFormatSerializer;

  const ThumbnailFormat._(String name): super(name);

  static BuiltSet<ThumbnailFormat> get values => _$values;
  static ThumbnailFormat valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class ThumbnailFormatMixin = Object with _$ThumbnailFormatMixin;

