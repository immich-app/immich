//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'audio_codec.g.dart';

class AudioCodec extends EnumClass {

  @BuiltValueEnumConst(wireName: r'mp3')
  static const AudioCodec mp3 = _$mp3;
  @BuiltValueEnumConst(wireName: r'aac')
  static const AudioCodec aac = _$aac;
  @BuiltValueEnumConst(wireName: r'libopus')
  static const AudioCodec libopus = _$libopus;

  static Serializer<AudioCodec> get serializer => _$audioCodecSerializer;

  const AudioCodec._(String name): super(name);

  static BuiltSet<AudioCodec> get values => _$values;
  static AudioCodec valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AudioCodecMixin = Object with _$AudioCodecMixin;

