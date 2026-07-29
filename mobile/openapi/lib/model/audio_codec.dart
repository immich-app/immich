//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Target audio codec
enum AudioCodec {
  mp3._(r'mp3'),
  aac._(r'aac'),
  opus._(r'opus'),
  pcmS16le._(r'pcm_s16le'),
  ;

  /// Instantiate a new enum with the provided value.
  const AudioCodec._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [AudioCodec] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static AudioCodec? fromJson(dynamic value) => AudioCodecTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [AudioCodec]
  /// that were successfully decoded from the passed [JSON][json].
  static List<AudioCodec> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AudioCodec>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AudioCodec.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AudioCodec] to String,
/// and [decode] dynamic data back to [AudioCodec].
class AudioCodecTypeTransformer {
  factory AudioCodecTypeTransformer() => _instance ??= const AudioCodecTypeTransformer._();

  const AudioCodecTypeTransformer._();

  /// Encodes this enum as a value suitable for JSON.
  String encode(AudioCodec data) => data._value;

  /// Returns the instance of [AudioCodec] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AudioCodec? decode(dynamic data, {bool allowNull = true}) {
    if (data is AudioCodec) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'mp3': return AudioCodec.mp3;
        case r'aac': return AudioCodec.aac;
        case r'opus': return AudioCodec.opus;
        case r'pcm_s16le': return AudioCodec.pcmS16le;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static AudioCodecTypeTransformer? _instance;
}

