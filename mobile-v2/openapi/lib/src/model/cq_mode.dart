//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'cq_mode.g.dart';

class CQMode extends EnumClass {

  @BuiltValueEnumConst(wireName: r'auto')
  static const CQMode auto = _$auto;
  @BuiltValueEnumConst(wireName: r'cqp')
  static const CQMode cqp = _$cqp;
  @BuiltValueEnumConst(wireName: r'icq')
  static const CQMode icq = _$icq;

  static Serializer<CQMode> get serializer => _$cQModeSerializer;

  const CQMode._(String name): super(name);

  static BuiltSet<CQMode> get values => _$values;
  static CQMode valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class CQModeMixin = Object with _$CQModeMixin;

