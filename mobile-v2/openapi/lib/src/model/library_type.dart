//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'library_type.g.dart';

class LibraryType extends EnumClass {

  @BuiltValueEnumConst(wireName: r'UPLOAD')
  static const LibraryType UPLOAD = _$UPLOAD;
  @BuiltValueEnumConst(wireName: r'EXTERNAL')
  static const LibraryType EXTERNAL = _$EXTERNAL;

  static Serializer<LibraryType> get serializer => _$libraryTypeSerializer;

  const LibraryType._(String name): super(name);

  static BuiltSet<LibraryType> get values => _$values;
  static LibraryType valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class LibraryTypeMixin = Object with _$LibraryTypeMixin;

