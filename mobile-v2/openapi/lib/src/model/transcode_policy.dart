//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcode_policy.g.dart';

class TranscodePolicy extends EnumClass {

  @BuiltValueEnumConst(wireName: r'all')
  static const TranscodePolicy all = _$all;
  @BuiltValueEnumConst(wireName: r'optimal')
  static const TranscodePolicy optimal = _$optimal;
  @BuiltValueEnumConst(wireName: r'bitrate')
  static const TranscodePolicy bitrate = _$bitrate;
  @BuiltValueEnumConst(wireName: r'required')
  static const TranscodePolicy required_ = _$required_;
  @BuiltValueEnumConst(wireName: r'disabled')
  static const TranscodePolicy disabled = _$disabled;

  static Serializer<TranscodePolicy> get serializer => _$transcodePolicySerializer;

  const TranscodePolicy._(String name): super(name);

  static BuiltSet<TranscodePolicy> get values => _$values;
  static TranscodePolicy valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class TranscodePolicyMixin = Object with _$TranscodePolicyMixin;

