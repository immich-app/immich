//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'transcode_hw_accel.g.dart';

class TranscodeHWAccel extends EnumClass {

  @BuiltValueEnumConst(wireName: r'nvenc')
  static const TranscodeHWAccel nvenc = _$nvenc;
  @BuiltValueEnumConst(wireName: r'qsv')
  static const TranscodeHWAccel qsv = _$qsv;
  @BuiltValueEnumConst(wireName: r'vaapi')
  static const TranscodeHWAccel vaapi = _$vaapi;
  @BuiltValueEnumConst(wireName: r'rkmpp')
  static const TranscodeHWAccel rkmpp = _$rkmpp;
  @BuiltValueEnumConst(wireName: r'disabled')
  static const TranscodeHWAccel disabled = _$disabled;

  static Serializer<TranscodeHWAccel> get serializer => _$transcodeHWAccelSerializer;

  const TranscodeHWAccel._(String name): super(name);

  static BuiltSet<TranscodeHWAccel> get values => _$values;
  static TranscodeHWAccel valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class TranscodeHWAccelMixin = Object with _$TranscodeHWAccelMixin;

